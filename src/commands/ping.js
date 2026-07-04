const { EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch').default;
const logger = require('@logging/logger');
const formatTimeDuration = require('@helpers/time/formatUptime');
const formatCompactNumber = require('@helpers/number/formatCompactNumber');
const bootstrap = require('@bot/bootstrap');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { getAllNodesInfo, parseNodeConfig } = require('@config/lavalinkConfig');
const { getApiHeaders, TimeoutRequest } = require('@config/http');
const redis = require('@database/redis');

// Baseline for bandwidth delta calculations — set once at load
let netBytesPrev = 0;
let statsTick = Date.now();

let lastCpuUsage = process.cpuUsage();
let lastCpuCheck = process.hrtime.bigint();

function getExternalNetBytes() {
    const ifaces = os.networkInterfaces();
    let bytes = 0;
    for (const name of Object.keys(ifaces)) {
        for (const iface of ifaces[name]) {
            if (iface.internal) continue;
            bytes += (iface.bytesSent || 0) + (iface.bytesReceived || 0);
        }
    }
    return bytes;
}

function getCpuLoadPct() {
    // CPU = core * 100%
    const cores = os.cpus().length;
    const currentUsage = process.cpuUsage(lastCpuUsage);
    const currentTime = process.hrtime.bigint();
    const elapsedNanos = currentTime - lastCpuCheck;
    lastCpuUsage = process.cpuUsage();
    lastCpuCheck = currentTime;
    const elapsedMicros = Number(elapsedNanos) / 1000;
    const totalCpuMicros = (currentUsage.user + currentUsage.system) / 1000;
    if (elapsedMicros <= 0) {
        return `0.00%`;
    }
    const cpuPercent = ((totalCpuMicros / elapsedMicros) * 100).toFixed(2);
    // Removed ${cores * 100}%
    // and now showing actual bot process CPU usage only
    return `${cpuPercent}%`;
}

async function deferOnce(ix) {
    if (!ix.deferred && !ix.replied) {
        await ix.deferReply({ flags: bootstrap.MessageFlags.Ephemeral });
    }
}

async function pullFirebaseStats() {
    try {
        const { db, isFirebaseReady } = require('@database/firebase');
        const { get, ref } = require('firebase/database');
        if (!isFirebaseReady || !db) return null;
        const snap = await get(ref(db, 'bot_statistics'));
        return snap.exists() ? snap.val() : null;
    } catch (err) {
        logger.error('Firebase stats fetch failed', err);
        return null;
    }
}

function sumCachedUsers() {
    const client = global.client;
    if (!client) return 0;
    let total = 0;
    for (const guild of client.guilds.cache.values()) {
        total += guild.memberCount || 0;
    }
    return total;
}

function getBotVersion() {
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));
        return pkg.version || '0.0.0';
    } catch {
        return '0.0.0';
    }
}

function sanitizeError(message) {
    if (!message) return 'Connection failed';
    let sanitized = message;
    sanitized = sanitized.replace(/https?:\/\/[^\/\s]+/gi, 'http://[REDACTED]');
    sanitized = sanitized.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[REDACTED]');
    sanitized = sanitized.replace(/\[[0-9a-f:]+\]/gi, '[REDACTED]');
    sanitized = sanitized.replace(/\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi, '[REDACTED]');
    return sanitized;
}

async function pingRedis() {
    if (!redis.isRedisReady) return { success: false, latency: null };
    try {
        const client = redis.getRedisClient();
        const start = Date.now();
        await client.ping();
        return { success: true, latency: Date.now() - start };
    } catch {
        return { success: false, latency: null };
    }
}

async function LavalinkNode(host, port, secure, password, location, flag, id) {
    const protocol = secure ? 'https' : 'http';
    const url = `${protocol}://${host}:${port}/v4/stats`;
    const start = Date.now();
    const resp = await fetch(url, {
        headers: { Authorization: password, 'User-Agent': 'QuranBot/1.0' },
        timeout: 6000,
    });
    const latency = Date.now() - start;
    if (resp.ok) {
        const data = await resp.json();
        return {
            success: true,
            latency,
            uptime: data.uptime,
            players: data.players ?? 0,
            host,
            port,
            location,
            flag,
            id,
        };
    }
    return {
        success: false,
        latency,
        host,
        port,
        location,
        flag,
        id,
        error: `HTTP ${resp.status}`,
    };
}

function getLavalink() {
    const nodes = getAllNodesInfo();
    if (nodes.length === 0) return [];
    return nodes.map((n) => ({
        id: n.index,
        host: n.host,
        port: n.port,
        password: n.password,
        secure: n.secure,
        location: n.location,
        flag: n.flag,
    }));
}

async function pingAll() {
    const nodes = getLavalink();
    if (nodes.length === 0) return [];
    const results = await Promise.allSettled(
        nodes.map((node) => LavalinkNode(node.host, node.port, node.secure, node.password, node.location, node.flag, node.id)),
    );
    return results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value)
        .sort((a, b) => a.id - b.id);
}

function _formLavalink_(result) {
    const status = result.success ? 'online' : 'offline';
    const flag = result.flag || '';
    const latency = result.success ? `${result.latency}ms` : 'offline';
    const uptime = result.success && result.uptime != null ? formatTimeDuration(result.uptime, 'en') : 'N/A';
    // Display players count from Lavalink node stats (active voice connections)
    const players = result.success && result.players != null ? result.players : 0;
    const nodeConfig = parseNodeConfig(result.id);
    const maxPlayers = nodeConfig?.maxPlayers || 'N/A';

    return [
        `> ${flag} ${status} Node ${result.id}`,
        `**  Location: ${result.location}**`,
        `*  Ping: ${latency}`,
        `*  Players: ${players}/${maxPlayers}`,
        `*  Uptime: ${uptime}`,
        '',
    ].join('\n');
}

netBytesPrev = getExternalNetBytes();

module.exports = {
    async execute(ix) {
        await deferOnce(ix);
        const client = ix.client;

        const tBotStart = Date.now();
        await ix.editReply({ content: 'Measuring speed' });
        const botLat = Math.max(0, Date.now() - tBotStart);

        const wsLat = client.ws.ping;

        const tApiStart = Date.now();
        await client.application.fetch();
        const apiLat = Date.now() - tApiStart;

        const uptimeFmt = formatTimeDuration(client.uptime, 'en');

        const guilds = client.guilds.cache.size;
        const users = sumCachedUsers();
        const fbStats = await pullFirebaseStats();
        const ver = getBotVersion();

        const azkar = fbStats?.azkarSent || 0;
        const cmds = fbStats?.commandsUsed || 0;
        const voiceCxns = fbStats?.voiceConnections ?? countVoiceCxns();
        const cpuUsage = getCpuLoadPct();
        const lavalink = await pingAll();
        const Redisping = await pingRedis();
        const botFlag = process.env.BOT_FLAG;
        const redisFlag = process.env.REDIS_FLAG;

        const status = new EmbedBuilder()
            .setColor(0xfefdfe)
            .setTitle('Bot Status')
            .addFields(
                { name: botFlag ? `${botFlag} Bot Latency` : 'Bot Latency', value: `${botLat} ms`, inline: true },
                {
                    name: redisFlag ? `${redisFlag} Redis Ping` : 'Redis Ping',
                    value: Redisping.success ? `${Redisping.latency} ms` : 'Offline',
                    inline: true,
                },
                { name: 'WebSocket Ping', value: `${wsLat} ms`, inline: true },
                { name: 'Discord API', value: `${apiLat} ms`, inline: true },
                { name: 'Uptime', value: uptimeFmt, inline: true },
                { name: 'Servers', value: formatCompactNumber(guilds), inline: true },
                { name: 'Total Users', value: formatCompactNumber(users), inline: true },
                { name: 'Voice Connections', value: formatCompactNumber(voiceCxns), inline: true },
                { name: 'Bot Version', value: ver, inline: true },
                { name: 'Commands Used', value: formatCompactNumber(cmds), inline: true },
                { name: 'CPU Usage', value: cpuUsage, inline: true },
                { name: 'Azkar Sent', value: formatCompactNumber(azkar), inline: true },
                {
                    name: 'Source Code',
                    value: '[GitHub](https://github.com/mgv-hub/quranbot)',
                    inline: true,
                },
            );

        if (lavalink.length > 0) {
            const lavalinkDisplay = lavalink.slice(0, 5);
            let pingLines_n = lavalinkDisplay.map(_formLavalink_).join('\n');

            status.addFields({
                name: `Servers Lavalink (${lavalinkDisplay.length}/${lavalink.length})`,
                value: pingLines_n || 'No nodes configured',
                inline: false,
            });
        }
        await ix.editReply({ content: null, embeds: [status] });
    },
};

function countVoiceCxns() {
    const client = global.client;
    if (!client) return 0;
    let count = 0;

    if (client.guilds?.cache) {
        for (const guild of client.guilds.cache.values()) {
            if (guild.members?.me?.voice?.channelId) count++;
        }
    }
    if (count) return count;

    if (global.guildStates) {
        for (const [gid, state] of global.guildStates) {
            if (state.connection && !state.connection.destroyed && state.channelId) {
                const g = client.guilds.cache.get(gid);
                if (g?.members?.me?.voice?.channelId) count++;
            }
        }
    }
    if (count) return count;

    if (client.voice?.adapters) {
        return client.voice.adapters.size;
    }
    return 0;
}
