require('pathlra-aliaser')();

require('../config/envSwitcher.js');
require('@startup/botSetup');
// require('@voiceHandlers');
require('@events/voiceStateHandler');
require('@interactions/interactionHandler');
require('@startup/readyHandler');
require('@events/additionalEvents');
require('@commands/ping');
require('@database/trackers/guild-tracker');
require('@web/top.gg');
require('@global/globalAll');
const formatCompactNumber = require('@helpers/number/formatCompactNumber');

const { ActivityType } = require('discord.js');
const { client, logger } = global;

process.on('unhandledRejection', (err) => {
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
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
    const { db, isFirebaseReady } = require('@database/firebase');
    if (!isFirebaseReady || !db) return null;
    const { get, ref } = require('firebase/database');
    const snap = await get(ref(db, 'bot_statistics'));
    return snap.exists() ? snap.val() : null;
}

// rotate status every 30s: prayer reminder, stats, github
async function updateStatus() {
    const hour = getCairoHour();
    const guildCount = client.guilds.cache.size;
    const voiceCount = getConnectedVoiceCount();
    const listenerCount = getTotalListeners();
    const totalUsers = AllUsers();
    const formattedUsers = formatCompactNumber(totalUsers);
    const azkarRooms = allAzkarRooms();
    const statsFirebase = await pullFirebase();
    const sentAzkar = statsFirebase?.azkarSent;

    let status;
    let activity;

    if (activityIndex % 5 === 0) {
        activity = {
            name: 'صلِّ على النبي ﷺ',
            type: ActivityType.Watching,
        };
    } else if (activityIndex % 5 === 1) {
        activity = {
            name: `${guildCount} Servers | ${formattedUsers} Users`,
            type: ActivityType.Watching,
        };
    } else if (activityIndex % 5 === 2) {
        activity = {
            name: `${voiceCount} Voice | ${listenerCount} Listeners | ${azkarRooms} Azkar chnl`,
            type: ActivityType.Watching,
        };
    } else if (activityIndex % 5 === 3) {
        activity = {
            name: `📿 ${sentAzkar} Azkar Sent`,
            type: ActivityType.Watching,
        };
    } else {
        activity = {
            name: 'مفتوح المصدر | github.com/mgv-hub/quranbot',
            type: ActivityType.Watching,
        };
    }
    status = hour >= 6 && hour < 12 ? 'online' : hour >= 12 && hour < 18 ? 'idle' : 'dnd';
    client.user?.setPresence({ status, activities: [activity] });
    activityIndex++;
}

client.once('clientReady', () => {
    const guildCount = client.guilds.cache.size;
    const voiceCount = getConnectedVoiceCount();
    logger.info(`Serving ${guildCount} servers`);
    logger.info(`Connected to ${voiceCount} voice channels`);
    updateStatus();
    setInterval(updateStatus, 10000);
});

logger.info('Bot initialized');
