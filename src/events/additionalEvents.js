const logger = require('@logging/logger');
const { removeGuildState, applyCommandPermissions } = require('@registry/registry');
const { ChannelType } = require('discord.js');
const botClient = require('@startup/botSetup').client;
const http = require('http');
// const { markGuildAsLeft, markGuildAsPresent } = require('../database/firebase/services/retention.service');
const retentiondb = require('@database/firebase/retention/retention');
const { sendWelcome } = require('@events/guildWelcome');

botClient.on('guildCreate', async (guild) => {
    logger.info('Bot Joined New Guild ' + guild.name + ' ' + guild.id);
    await sendWelcome(guild);
    await retentiondb.markGuildAsPresent(guild.id);

    //  try {
    //      const guildOwner = await guild.fetchOwner();
    //      const trackingChannel = guild.channels.cache.find(
    //          (channel) => channel.type === ChannelType.GuildText && channel.permissionsFor(botClient.user).has('CreateInstantInvite'),
    //      );

    //      if (trackingChannel) {
    //          const trackingInvite = await trackingChannel.createInvite({
    //              maxAge: 0,
    //              maxUses: 0,
    //              unique: true,
    //              reason: 'Permanent invite for tracking',
    //          });
    //          logger.info('Tracked New Guild ' + guild.id + ' With Invite ' + trackingInvite.url);
    //      } else {
    //          // logger.warn('No Suitable Text Channel Found In Guild ' + guild.id);
    //      }
    //  } catch (err) {
    //      logger.error('Error Tracking Guild ' + guild.id);
    //  }

    logger.info(`Bot Joined New Guild: ${guild.name} ${guild.id}`);

    // Robust setup restoration on rejoin.
    // Loads from Firebase and syncs state immediately to prevent "not configured" errors on commands.
    try {
        // Ensure global setupGuilds object exists before modification
        global.setupGuilds = global.setupGuilds || {};

        if (!global.setupGuilds[guild.id]) {
            const { loadSetupGuildsFromFirebase } = require('@database/firebase');
            const firebaseData = await loadSetupGuildsFromFirebase();

            if (firebaseData && firebaseData[guild.id]) {
                const data = firebaseData[guild.id];
                // Check if data is valid and has a voice channel ID
                if (data.voiceChannelId) {
                    global.setupGuilds[guild.id] = data;
                    logger.info(`Restored setup data for guild ${guild.id} from Firebase`);

                    // Sync voice channel ID to runtime state if available
                    const { getGuildState } = require('../state/GuildStateManager');
                    const guildState = getGuildState(guild.id);
                    if (guildState) {
                        guildState.channelId = data.voiceChannelId;
                    }
                } else {
                    logger.warn(`Setup data for guild ${guild.id} is missing voiceChannelId. Skipping restoration.`);
                }
            } else {
                logger.info(`No previous setup data found for guild ${guild.id}`);
            }
        }
    } catch (reloadErr) {
        logger.warn(`Setup restoration failed for guild ${guild.id}: ${reloadErr.message}`);
    }

    await applyCommandPermissions(guild);
});

botClient.on('guildDelete', async (guild) => {
    const guildId = guild.id;
    await retentiondb.markGuildAsLeft(guildId);
    //logger.info(`Bot left guild ${guild.name} (${guildId}). Data retained for 15 days.`);
    //if (global.guildStates) global.guildStates.delete(guildId);
    // Remove from local cache data persists in Firebase for 15 days
    //if (global.setupGuilds && global.setupGuilds[guildId]) {
    //    delete global.setupGuilds[guildId];
    //}
});

let healthCheckServerActive = false;
const healthServer = http.createServer((request, response) => {
    if (request.url === '/health') {
        try {
            const activeVoiceConnections = getConnectedVoiceCount();
            const botuptime = process.uptime();
            const currentMemory = process.memoryUsage();
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(
                JSON.stringify({
                    status: 'ok',
                    voiceConnections: activeVoiceConnections,
                    uptime: botuptime,
                    memory: {
                        // Providing detailed memory usage stats for better monitoring and debugging insights
                        rss: currentMemory.rss,
                        heapTotal: currentMemory.heapTotal,
                        heapUsed: currentMemory.heapUsed,
                    },
                    timestamp: new Date(),
                }),
            );
        } catch (err) {
            response.writeHead(500);
            response.end(JSON.stringify({ status: 'error', message: err.message }));
        }
    } else {
        response.writeHead(404);
        response.end();
    }
});

const healthPort = process.env.HH_CH_PORT;
if (!healthCheckServerActive) {
    healthServer
        .listen(healthPort, () => {
            logger.info('Health Check Server Running On Port ' + healthPort);
        })
        .on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                logger.warn('Port ' + healthPort + ' Already In Use Skipping Health Server');
            } else {
                logger.error('Health Server Error', err);
            }
        });
    healthCheckServerActive = true;
}

function getConnectedVoiceCount() {
    if (!global.guildStates) return 0;
    let activeCount = 0;
    for (const guildState of global.guildStates.values()) {
        if (guildState.connection && !guildState.connection.destroyed && guildState.channelId) {
            activeCount++;
        }
    }
    return activeCount;
}

require('@global/globalAll');
