require('pathlra-aliaser');
const logger = require('@logger');
const { joinVoiceChannel, createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');
const { getGuildState, setupPlayerEvents } = require('@GuildStateManager-core_state');
const persistentStateManager = require('@PersistentStateManager-core_state');

let restorationInProgress = false;

async function restoreGuildStates(client, actualBotGuilds) {
   const allStates = persistentStateManager.getAllStates();
   logger.info(
      'Attempting To Restore ' + Object.keys(allStates).length + ' Guild States From Persistent State Manager',
   );

   const statesToRestore = Object.keys(allStates).filter((gid) => actualBotGuilds.has(gid));
   logger.info('Will Restore States For ' + statesToRestore.length + ' Guilds Bot Is Actually In');

   if (!restorationInProgress && statesToRestore.length > 0) {
      restorationInProgress = true;
      let restoredCount = 0;
      let failedCount = 0;

      for (let i = 0; i < statesToRestore.length; i++) {
         const guildId = statesToRestore[i];
         setTimeout(async () => {
            const state = allStates[guildId];
            const result = await persistentStateManager.restoreGuildState(guildId, client);

            if (result.success) {
               const guildState = getGuildState(guildId);

               if (!guildState.connection || guildState.connection.destroyed) {
                  try {
                     const connection = await joinVoiceChannel({
                        channelId: result.channel.id,
                        guildId: guildId,
                        adapterCreator: result.channel.guild.voiceAdapterCreator,
                        selfDeaf: true,
                     });

                     guildState.connection = connection;
                     guildState.channelId = result.channel.id;
                     guildState.currentReciter = state.currentReciter;
                     guildState.currentSurah = state.currentSurahIndex + 1;
                     guildState.playbackMode = state.playbackMode;
                     guildState.currentRadioIndex = state.currentRadioIndex;
                     guildState.isPaused = false;
                     guildState.playedOffset = state.playedOffset || 0;

                     connection.subscribe(guildState.player);
                     logger.info('Guild ' + guildId + ' Connection Subscribed On Restore');

                     if (state.playbackMode === 'surah') {
                        try {
                           const resource = await global.createSurahResource(guildState, state.currentSurahIndex, 0);
                           guildState.player.play(resource);
                           guildState.isPaused = false;
                           guildState.playbackStartTime = Date.now();

                           await new Promise((resolve) => setTimeout(resolve, 3000));

                           if (guildState.player.state.status === AudioPlayerStatus.Idle) {
                              logger.warn('Guild ' + guildId + ' Player Idle After Restore Retrying');
                              const retryResource = await global.createSurahResource(
                                 guildState,
                                 state.currentSurahIndex,
                                 0,
                              );
                              guildState.player.play(retryResource);
                           }

                           logger.info('Started Playback On Restore For Guild ' + guildId);
                        } catch (surahError) {
                           logger.warn('Failed To Play Surah On Restore For Guild ' + guildId, surahError);
                           guildState.isPaused = true;
                        }
                     }

                     persistentStateManager.setManualDisconnect(guildId, false);
                     restoredCount++;
                     logger.info('Restored Voice Connection For Guild ' + guildId);
                  } catch (error) {
                     failedCount++;
                     logger.error('Failed To Restore Voice Connection For Guild ' + guildId, error);
                  }
               } else {
                  logger.info('Guild ' + guildId + ' Already Has Active Connection Skipping');

                  if (guildState.player.state.status === AudioPlayerStatus.Idle) {
                     logger.info('Guild ' + guildId + ' Connection Exists But Player Idle Starting Playback');
                     try {
                        if (state.playbackMode === 'surah') {
                           const resource = await global.createSurahResource(guildState, state.currentSurahIndex, 0);
                           guildState.player.play(resource);
                           guildState.isPaused = false;
                        }
                     } catch (error) {
                        logger.error('Guild ' + guildId + ' Playback Start Failed', error);
                     }
                  }

                  guildState.connection.subscribe(guildState.player);
               }
            } else {
               failedCount++;
               logger.info('Skipped Restoration For Guild ' + guildId + ' ' + result.reason);
            }

            if (restoredCount + failedCount === statesToRestore.length) {
               logger.info(
                  'State Restoration Complete ' + restoredCount + ' Restored ' + failedCount + ' Failed Or Skipped',
               );
               restorationInProgress = false;
            }
         }, i * 500);
      }
   }
}

module.exports.restoreGuildStates = restoreGuildStates;
