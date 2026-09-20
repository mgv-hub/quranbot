const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const formatTimeDuration = require('@shared/Formatting/FormatUptime');
const formatCompactNumber = require('@shared/Formatting/FormatCompactNumber');
const logger = require('@infrastructure/Logging/Logger');
const os = require('os');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const fetch = require('node-fetch').default;
const redis = require('@infrastructure/Persistence/Redis/RedisIndex');
const { getAllNodesInfo, parseNodeConfig } = require('@config/LavalinkConfig');
const { getApiHeaders, TimeoutRequest } = require('@config/HttpConfig');

let lastCpuUsage = process.cpuUsage();
let lastCpuCheck = process.hrtime.bigint();

const keepAliveHttpAgent = new http.Agent({ keepAlive: true, maxSockets: 20 });
const keepAliveHttpsAgent = new https.Agent({ keepAlive: true, maxSockets: 20 });

function getBotVersion() {
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../package.json'), 'utf8'));
        return pkg.version || '0.0.0';
    } catch {
        return '0.0.0';
    }
}

function getCpuLoadPct() {
    const currentUsage = process.cpuUsage(lastCpuUsage);
    const currentTime = process.hrtime.bigint();
    const elapsedNanos = currentTime - lastCpuCheck;
    lastCpuUsage = process.cpuUsage();
    lastCpuCheck = currentTime;
    const elapsedMicros = Number(elapsedNanos) / 1000;
    const totalCpuMicros = (currentUsage.user + currentUsage.system) / 1000;
    if (elapsedMicros <= 0) return '0.00%';
    const cpuPercent = ((totalCpuMicros / elapsedMicros) * 100).toFixed(2);
    return `${cpuPercent}%`;
}

function getConnectedVoiceCount(client) {
    let count = 0;
    client.guilds.cache.forEach((guild) => {
        if (guild.members.me?.voice?.channelId) count++;
    });
    if (count === 0 && global.guildStates) {
        for (const [guildId, state] of global.guildStates.entries()) {
            if (state.connection && !state.connection.destroyed && state.channelId) {
                const actualGuild = client.guilds.cache.get(guildId);
                if (actualGuild?.members.me?.voice?.channelId) count++;
            }
        }
    }
    return count;
}

function getTotalListeners(client) {
    let totalListeners = 0;
    client.guilds.cache.forEach((guild) => {
        const voiceChannel = guild.members.me?.voice?.channel;
        if (voiceChannel && voiceChannel.members) {
            totalListeners += voiceChannel.members.filter((m) => !m.user.bot).size;
        }
    });
    return totalListeners;
}

function getListenerDetails(client) {
    const listenerDetails = [];
    client.guilds.cache.forEach((guild) => {
        const voiceChannel = guild.members.me?.voice?.channel;
        if (voiceChannel && voiceChannel.members) {
            voiceChannel.members
                .filter((m) => !m.user.bot)
                .forEach((member) => {
                    const states = [];
                    if (member.voice.mute) states.push('Muted');
                    if (member.voice.deaf) states.push('Deafened');
                    if (member.voice.serverMute) states.push('Server Muted');
                    if (member.voice.serverDeaf) states.push('Server Deafened');
                    if (states.length === 0) states.push('Active');
                    listenerDetails.push({
                        username: member.user.username,
                        displayName: member.displayName,
                        states: states,
                    });
                });
        }
    });
    return listenerDetails;
}

function getAllUsers(client) {
    let totalUsers = 0;
    client.guilds.cache.forEach((guild) => {
        totalUsers += guild.memberCount || 0;
    });
    return totalUsers;
}

function allAzkarRooms() {
    let count = 0;
    if (global.setupGuilds) {
        for (const data of Object.values(global.setupGuilds)) {
            if (data?.azkarChannelId) count++;
        }
    }
    return count;
}

async function pullFirebaseStats() {
    try {
        const { db, isFirebaseReady } = require('@infrastructure/Persistence/Firebase/FirebaseIndex');
        const { get, ref } = require('firebase/database');
        if (!isFirebaseReady || !db) return null;
        const snap = await get(ref(db, 'bot_statistics'));
        return snap.exists() ? snap.val() : null;
    } catch (err) {
        logger.error('Firebase stats fetch failed', err);
        return null;
    }
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
    try {
        const resp = await fetch(url, {
            headers: { Authorization: password, 'User-Agent': 'QuranBot/1.0', ...getApiHeaders() },
            timeout: 5000, // Reduced timeout to 5s for accurate and fast ping measurement
            agent: secure ? keepAliveHttpsAgent : keepAliveHttpAgent,
        });
        const latency = Date.now() - start;
        if (resp.ok) {
            const data = await resp.json();
            return { success: true, latency, uptime: data.uptime, players: data.players ?? 0, host, port, location, flag, id };
        }
        return { success: false, latency, host, port, location, flag, id, error: `HTTP ${resp.status}` };
    } catch (err) {
        return { success: false, latency: Date.now() - start, host, port, location, flag, id, error: err.message };
    }
}

async function pingAll() {
    const nodes = getAllNodesInfo();
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
    const flag = result.flag || '🌍';
    const latency = result.success ? `${result.latency}ms` : 'offline';
    const uptime = result.success && result.uptime != null ? formatTimeDuration(result.uptime, 'en') : 'N/A';
    const players = result.success && result.players != null ? result.players : 0;
    const nodeConfig = parseNodeConfig(result.id);
    const maxPlayers = nodeConfig?.maxPlayers || 'N/A';
    return `> ${flag} ${status} Node ${result.id}\n**  Location: ${result.location}**\n*  Ping: ${latency}\n*  Players: ${players}/${maxPlayers}\n*  Uptime: ${uptime}\n`;
}

module.exports.customId = 'admin_bot_stats';

module.exports.execute = async function execute(interaction) {
    const requesterId = interaction.user.id;
    const isAuthorized = global.SPE_USER_IDS.includes(requesterId);

    if (!isAuthorized) {
        return interaction.reply({
            content: 'This feature is available for the developers only',
            flags: 64,
        });
    }

    await interaction.deferUpdate();

    const botClient = global.client;
    const cachedGuilds = botClient.guilds.cache;
    const aggregateMembers = cachedGuilds.reduce((total, guild) => total + guild.memberCount, 0);
    const humanUsers = aggregateMembers - cachedGuilds.reduce((acc, g) => acc + g.members.cache.filter((m) => m.user.bot).size, 0);

    const memoryStats = process.memoryUsage();
    const rssMegabytes = (memoryStats.rss / 1024 / 1024).toFixed(2);
    const currentPlatform = os.platform();
    const runtimeVersion = process.version;
    const cpuUsage = getCpuLoadPct();
    const ver = getBotVersion();

    const tBotStart = Date.now();
    const botLat = Math.max(0, Date.now() - tBotStart);
    const wsLat = botClient.ws.ping;

    const tApiStart = Date.now();
    await botClient.application.fetch();
    const apiLat = Date.now() - tApiStart;

    const uptimeFmt = formatTimeDuration(botClient.uptime, 'en');
    const guilds = cachedGuilds.size;
    const users = getAllUsers(botClient);
    const formattedUsers = formatCompactNumber(users);
    const voiceCxns = getConnectedVoiceCount(botClient);
    const listenerCount = getTotalListeners(botClient);
    const listenerDetails = getListenerDetails(botClient);
    const azkarRooms = allAzkarRooms();

    const fbStats = await pullFirebaseStats();
    const sentAzkar = fbStats?.azkarSent || 0;
    const cmds = fbStats?.commandsUsed || 0;

    const Redisping = await pingRedis();
    const lavalink = await pingAll();

    const botFlag = process.env.BOT_FLAG;
    const redisFlag = process.env.REDIS_FLAG;

    const statsEmbed = new EmbedBuilder()
        .setColor(0xfefdfe)
        .setTitle('Detailed Bot Statistics')
        .setDescription('**Bot and Server Information**')
        .addFields(
            { name: 'Bot Version', value: String(ver), inline: true },
            { name: 'Platform', value: String(currentPlatform), inline: true },
            { name: 'Node.js', value: String(runtimeVersion), inline: true },
            { name: 'Start Date', value: `<t:${Math.floor((Date.now() - botClient.uptime) / 1000)}:R>`, inline: true },
            { name: 'Uptime', value: String(uptimeFmt), inline: true },
            { name: 'CPU Usage', value: String(cpuUsage), inline: true },
            { name: 'Memory (RSS)', value: `${rssMegabytes} MB`, inline: true },
            { name: 'Protection System', value: 'Active', inline: true },
            { name: botFlag ? `${botFlag} Bot Latency` : 'Bot Latency', value: `${botLat} ms`, inline: true },
            {
                name: redisFlag ? `${redisFlag} Redis Ping` : 'Redis Ping',
                value: Redisping.success ? `${Redisping.latency} ms` : 'Offline',
                inline: true,
            },
            { name: 'WebSocket Ping', value: `${wsLat} ms`, inline: true },
            { name: 'Discord API', value: `${apiLat} ms`, inline: true },
            { name: 'Servers', value: formatCompactNumber(guilds), inline: true },
            { name: 'Total Users', value: formattedUsers, inline: true },
            { name: 'Human Users', value: formatCompactNumber(humanUsers), inline: true },
            { name: 'Voice Connections', value: formatCompactNumber(voiceCxns), inline: true },
            { name: 'Listeners', value: formatCompactNumber(listenerCount), inline: true },
            { name: 'Azkar Channels', value: formatCompactNumber(azkarRooms), inline: true },
            { name: 'Commands Used', value: formatCompactNumber(cmds), inline: true },
            { name: `📿 Azkar Sent`, value: formatCompactNumber(sentAzkar), inline: true },
        );

    if (listenerDetails.length > 0) {
        const listenerSummary = listenerDetails
            .slice(0, 20)
            .map((listener) => {
                const name = listener.displayName || listener.username;
                return `• **${name}**: ${listener.states.join(', ')}`;
            })
            .join('\n');
        statsEmbed.addFields({
            name: `Listener Details (${listenerDetails.length})`,
            value: listenerSummary || 'No listeners',
            inline: false,
        });
    }

    if (lavalink.length > 0) {
        const lavalinkDisplay = lavalink.slice(0, 5);
        const pingLines = lavalinkDisplay.map(_formLavalink_).join('\n');
        statsEmbed.addFields({
            name: `Servers Lavalink (${lavalinkDisplay.length}/${lavalink.length})`,
            value: pingLines || 'No nodes configured',
            inline: false,
        });
    }

    const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('admin_back_to_panel').setLabel('Back to Panel').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('admin_refresh_stats').setLabel('Refresh').setStyle(ButtonStyle.Secondary),
    );

    await interaction.followUp({
        embeds: [statsEmbed],
        components: [actionRow],
        flags: 64,
    });
};
