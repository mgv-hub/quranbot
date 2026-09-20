// const logger = require('@infrastructure/Logging/Logger');
// const voiceLogger = require('@infrastructure/Logging/VoiceLogger');
// const { ChannelType } = require('discord.js');
// // const { AudioPlayerStatus } = require('@discordjs/voice');
// const { getGuildStateById } = require('@state/GuildStateStore');
// const persistentStateManager = require('@state/PersistentStateManager');
// const { initializeConnection, syncVoiceState } = require('@modules/Audio/AudioModule');
// const { restorePlaybackState, startPlayback } = require('@modules/Audio/Interactions/Helpers/VoiceJoinHelper');

// async function recoverVoiceConnection(guild, fixedSetupData, guildId) {
//     voiceLogger.recovery(guildId, 'Starting voice recovery', { voiceChannelId: fixedSetupData?.voiceChannelId });

//     if (!fixedSetupData?.voiceChannelId) {
//         const storedState = persistentStateManager.getGuildState(guildId);
//         if (storedState?.voiceChannelId) {
//             fixedSetupData = { ...(fixedSetupData || {}), voiceChannelId: storedState.voiceChannelId };
//         } else {
//             voiceLogger.recovery(guildId, 'Recovery skipped no voice channel ID in setup');
//             return;
//         }
//     }

//     let targetVoiceChannel = null;
//     try {
//         targetVoiceChannel = guild.channels.cache.get(fixedSetupData.voiceChannelId) || (await guild.channels.fetch(fixedSetupData.voiceChannelId).catch(() => null));
//     } catch (error) {
//         voiceLogger.recovery(guildId, 'Failed to fetch voice channel', { error: error.message });
//         logger.info(`Guild ${guildId} Voice Channel ${fixedSetupData.voiceChannelId} Not Accessible`);
//     }

//     if (!targetVoiceChannel || targetVoiceChannel.type !== ChannelType.GuildVoice) {
//         voiceLogger.recovery(guildId, 'Voice channel not found or invalid type');
//         return;
//     }

//     const guildState = getGuildStateById(guildId);
//     const humanCount = targetVoiceChannel.members.filter((m) => !m.user.bot).size;

//     if (humanCount === 0) {
//         const { joinVoiceChannel } = require('@discordjs/voice');

//         guildState.rawConnection = joinVoiceChannel({
//             channelId: targetVoiceChannel.id,
//             guildId: guild.id,
//             adapterCreator: guild.voiceAdapterCreator,
//             selfDeaf: true,
//         });

//         guildState.channelId = targetVoiceChannel.id;
//         guildState.isPaused = true;
//         guildState.pauseReason = 'inactivity_raw';

//         await syncVoiceState(guildId, guildState);
//         const { updateVoiceStatus, clearStatusCache } = require('@modules/Audio/Voice/VoiceStatus');
//         clearStatusCache();
//         await updateVoiceStatus(guildId, guildState, guild.client);
//         voiceLogger.recovery(guildId, 'Joined via raw voice (channel empty)');
//         return;
//     }
//     try {
//         await initializeConnection(guildId, guildState, targetVoiceChannel, guild.voiceAdapterCreator);
//         voiceLogger.recovery(guildId, 'Voice connection re-established');
//         const storedState = persistentStateManager.getGuildState(guildId);
//         guildState.controlMode = storedState?.controlMode || 'everyone';
//         restorePlaybackState(guildState);

//         guildState.isPaused = false;
//         guildState.pauseReason = null;
//         guildState.playbackStartTime = Date.now();
//         guildState.lastActivity = Date.now();

//         const played = await startPlayback(guildState, guildId);
//         if (!played) {
//             voiceLogger.warn(guildId, 'Playback failed during recovery, falling back to surah');
//             guildState.playbackMode = 'surah';
//             const reciters = Object.keys(global.reciters || {});
//             guildState.currentReciter = reciters[0] || 'reciter_1_ar';
//             guildState.currentSurah = 1;
//             await startPlayback(guildState, guildId);
//         }
//         await syncVoiceState(guildId, guildState);
//         voiceLogger.recovery(guildId, 'Voice recovery completed successfully');
//     } catch (connectionError) {
//         voiceLogger.error(guildId, 'Failed to reconnect voice channel', connectionError);
//     }
// }

// module.exports.recoverVoiceConnection = recoverVoiceConnection;
