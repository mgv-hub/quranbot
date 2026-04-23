require('pathlra-aliaser');
const logger = require('@logger');
const { ChannelType } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');
const { getGuildState, setupPlayerEvents } = require('@GuildStateManager-core_state');
const persistentStateManager = require('@PersistentStateManager-core_state');

async function resetPlayerForRecovery(state, guildId) {
   if (!state || !state.player) {
      return false;
   }
   try {
      state.player.stop();
      state.player.removeAllListeners();
      const newPlayer = createAudioPlayer({
         behaviors: {
            noSubscriberTimeout: 60000,
            maxMissedFrames: 500,
         },
      });
      state.player = newPlayer;
      state.errorCount = 0;
      state.isPaused = true;
      state.pauseReason = 'recovery_reset';
      setupPlayerEvents(guildId, newPlayer);
      logger.info('Guild ' + guildId + ' Player Reset For Recovery');
      return true;
   } catch (error) {
      logger.error('Guild ' + guildId + ' Player Reset Failed', error);
      return false;
   }
}

async function recoverVoiceConnection(guild, fixedSetupData, guildId) {
   if (fixedSetupData.voiceChannelId) {
      let voiceChannel = null;
      try {
         voiceChannel =
            guild.channels.cache.get(fixedSetupData.voiceChannelId) ||
            (await guild.channels.fetch(fixedSetupData.voiceChannelId).catch(() => null));
      } catch (error) {
         logger.info('Guild ' + guildId + ' Voice Channel ' + fixedSetupData.voiceChannelId + ' Not Accessible');
      }

      if (voiceChannel && voiceChannel.type === ChannelType.GuildVoice) {
         const state = getGuildState(guildId);
         const persistentState = persistentStateManager.getGuildState(guildId);
         const manualDisconnect = persistentState?.manualDisconnectFlag;

         if (!state.connection || state.connection.destroyed) {
            if (!manualDisconnect) {
               try {
                  await resetPlayerForRecovery(state, guildId);

                  const connection = await joinVoiceChannel({
                     channelId: voiceChannel.id,
                     guildId: guildId,
                     adapterCreator: guild.voiceAdapterCreator,
                     selfDeaf: true,
                  });

                  state.connection = connection;
                  state.channelId = voiceChannel.id;
                  state.playbackMode = persistentState?.playbackMode || 'surah';
                  state.isPaused = false;

                  const reciterKeys = Object.keys(global.reciters || {});
                  const randomReciterKey = reciterKeys[Math.floor(Math.random() * reciterKeys.length)];
                  state.currentReciter = persistentState?.currentReciter || randomReciterKey;
                  state.currentSurah = (persistentState?.currentSurahIndex || 0) + 1;
                  state.playedOffset = persistentState?.playedOffset || 0;
                  state.playbackStartTime = Date.now();
                  state.lastActivity = Date.now();

                  connection.subscribe(state.player);
                  logger.info('Guild ' + guildId + ' Connection Subscribed After Recovery');

                  logger.info(
                     'Connected To Voice Channel For Guild ' +
                        guildId +
                        ' ' +
                        guild.name +
                        ' Channel ' +
                        voiceChannel.id +
                        ' Playing Surah ' +
                        state.currentSurah,
                  );

                  try {
                     const resource = await global.createSurahResource(state, state.currentSurah - 1, 0, 0, false);
                     state.player.play(resource);
                     state.isPaused = false;
                     state.pauseReason = null;

                     await new Promise((resolve) => setTimeout(resolve, 3000));

                     if (state.player.state.status === AudioPlayerStatus.Idle) {
                        logger.warn('Guild ' + guildId + ' Player Idle After Recovery Retrying');
                        const retryResource = await global.createSurahResource(
                           state,
                           state.currentSurah - 1,
                           0,
                           0,
                           true,
                        );
                        state.player.play(retryResource);
                     }

                     logger.info('Started Playback For Guild ' + guildId);
                  } catch (playError) {
                     logger.error('Failed To Start Playback For Guild ' + guildId, playError);
                     state.isPaused = true;
                  }

                  persistentState.connectionStatus = true;
                  persistentState.voiceChannelId = voiceChannel.id;
                  persistentStateManager.updateGuildState(guildId, persistentState);

                  const { saveRuntimeStates } = require('@RuntimeState-core_runtime');
                  await saveRuntimeStates();
               } catch (err) {
                  logger.error('Failed To Connect To Voice Channel For Guild ' + guildId, err);
               }
            } else {
               logger.info('Skipping Voice Connection For Guild ' + guildId + ' Manual Disconnect Flag Set');
            }
         } else {
            logger.info('Guild ' + guildId + ' Already Has Active Connection');

            if (state.player.state.status === AudioPlayerStatus.Idle) {
               logger.info('Guild ' + guildId + ' Connection Exists But Player Idle Starting Playback');
               try {
                  const resource = await global.createSurahResource(state, state.currentSurah - 1, 0, 0, false);
                  state.player.play(resource);
                  state.isPaused = false;
                  state.pauseReason = null;
               } catch (error) {
                  logger.error('Guild ' + guildId + ' Playback Start Failed', error);
               }
            }

            state.connection.subscribe(state.player);
         }
      } else {
         logger.info('Guild ' + guildId + ' Voice Channel Not Found Or Invalid Type Skipping');
         const state = getGuildState(guildId);
         const persistentState = persistentStateManager.getGuildState(guildId);
         state.channelId = null;
         persistentState.voiceChannelId = null;
      }
   }
}

module.exports.recoverVoiceConnection = recoverVoiceConnection;
