require('pathlra-aliaser')();

require('@config/EnvSwitcher');
require('@bootstrap/BotSetup');
// require('@voiceHandlers');
require('@infrastructure/Discord/Events/VoiceStateHandler');
require('@infrastructure/Discord/Interactions/InteractionHandler');
require('@bootstrap/ReadyHandler');
require('@infrastructure/Discord/Events/AdditionalEvents');
require('@modules/Community/Commands/PingCommand');
require('@trackers/GuildTracker');
require('@infrastructure/External/TopGg');
require('@core/GlobalBindings');
const formatCompactNumber = require('@shared/Formatting/FormatCompactNumber');

const { ActivityType } = require('discord.js');
const { client, logger } = global;
const auditLogger = require('@infrastructure/Logging/AuditLogger');
const dns = require('node:dns');
const statusManager = require('@state/StatusManager');

dns.setDefaultResultOrder('ipv4first');

process.on('unhandledRejection', (err) => {
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    
    if (err?.code === 'ECONNREFUSED' || message.includes('ECONNREFUSED') || err?.code === 'ETIMEDOUT' || message.includes('ETIMEDOUT') || message.includes('fetch failed')) {
        logger.warn(`network error: ${message}`);
        return;
    }

    logger.error(`Unhandled rejection: ${message}`);
    if (err?.stack) {
        logger.error(err.stack);
    }
});
process.on('uncaughtException', (err) => {
    logger.error(`Unexpected exception: ${err.message}`);

    if (err.stack) {
        logger.error(err.stack);
    }
    if (err.code === 'ECONNREFUSED') {
        logger.warn('Connection refused, retrying later...');
        return;
    }
    if (err.code === 'ETIMEDOUT') {
        logger.warn('Request timed out.');
    }
});

let activityIndex = 0;

// cairo time helper utc+2
function getCairoHour() {
    const now = new Date();
    return (now.getUTCHours() + 2) % 24;
}

function getCairoMinutes() {
    // ?
    const now = new Date();
    return now.getUTCMinutes();
}

// count active voice connections with fallbacks
function getConnectedVoiceCount() {
    let count = 0;
    client.guilds.cache.forEach((guild) => {
        if (guild.members.me?.voice?.channelId) {
            count++;
        }
    });
    // fallback to guildStates map
    if (count === 0 && global.guildStates) {
        for (const [guildId, state] of global.guildStates.entries()) {
            if (state.connection && !state.connection.destroyed && state.channelId) {
                const actualGuild = client.guilds.cache.get(guildId);
                if (actualGuild?.members.me?.voice?.channelId) {
                    count++; // ?
                }
            }
        }
    }
    // last resort: voice adapters
    if (count === 0 && client.voice?.adapters) {
        count = client.voice.adapters.size;
    }
    return count;
}

// count human listeners in voice channels
function getTotalListeners() {
    let totalListeners = 0;
    client.guilds.cache.forEach((guild) => {
        const voiceChannel = guild.members.me?.voice?.channel;
        if (voiceChannel && voiceChannel.members) {
            const listeners = voiceChannel.members.filter((m) => !m.user.bot).size;
            totalListeners += listeners;
        }
    });
    return totalListeners;
}

function AllUsers() {
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

async function pullFirebase() {
    const { db, isFirebaseReady } = require('@infrastructure/Persistence/Firebase/FirebaseIndex');
    if (!isFirebaseReady || !db) return null;
    const { get, ref } = require('firebase/database');
    const snap = await get(ref(db, 'bot_statistics'));
    return snap.exists() ? snap.val() : null;
}

function updateStatus() {
    const currentStatus = statusManager.getStatus();
    
    if (currentStatus.activityText) {
        return;
    }

    const voiceCount = getConnectedVoiceCount();
    const listenerCount = getTotalListeners();
    const totalUsers = AllUsers();

    client.user?.setPresence({
        status: currentStatus.presence || 'online',
        activities: [
            {
                name: `${formatCompactNumber(voiceCount)} Voice | ${formatCompactNumber(listenerCount)} Listeners | ${formatCompactNumber(totalUsers)} Users`,
                type: ActivityType.Watching,
            },
        ],
    });
}

client.once('clientReady', () => {
    const guildCount = client.guilds.cache.size;
    const voiceCount = getConnectedVoiceCount();
    logger.info(`Serving ${guildCount} servers`);
    logger.info(`Connected to ${voiceCount} voice channels`);
    auditLogger.startAuditFlushInterval();
    const adminUserId = auditLogger.getLogAdminUserId();
    logger.info(`Audit logs ${adminUserId}`);
    updateStatus();
    setInterval(updateStatus, 10000);
});

logger.info('Bot initialized');
