require('pathlra-aliaser');

const { joinVoiceChannel } = require('@discordjs/voice');
const logger = require('@logger');
const persistentStateManager = require('@PersistentStateManager-core_state');
const { getVoiceChannel, checkBotPermissions } = require('@sys-voice-core_interactions_buttons');
const { resetPlayerState } = require('@sys-player-core_interactions_buttons');
const { getAvailableSurahIndex, getReciterInfo } = require('@sys-surah-core_interactions_buttons');
const { startPlayback } = require('@sys-playback-core_interactions_buttons');
const { ERRORS } = require('@sys-config-core_interactions_buttons');

async function joinVoiceChannelHandler(interaction, guildId, state) {
   const guild = interaction.guild;
   const setupData = global.setupGuilds ? global.setupGuilds[guildId] : null;

   const channelResult = await getVoiceChannel(guild, setupData, state);
   if (!channelResult.channel) {
      return { success: false, error: channelResult.error };
   }

   const { channel: voiceChannel, channelId: voiceChannelId } = channelResult;

   if (!checkBotPermissions(voiceChannel, guild.members.me)) {
      return { success: false, error: ERRORS.NO_PERMISSIONS };
   }

   try {
      if (state.connection && !state.connection.destroyed) {
         try {
            state.connection.unsubscribe(state.player);
         } catch (error) {
            logger.info('Error Unsubscribing Player In Guild ' + guildId, error);
         }
         state.connection.destroy();
         state.connection = null;
         state.channelId = null;
      }

      await resetPlayerState(state, guildId);

      state.connection = await joinVoiceChannel({
         channelId: voiceChannelId,
         guildId: guildId,
         adapterCreator: guild.voiceAdapterCreator,
         selfDeaf: true,
      });

      state.channelId = voiceChannelId;
      persistentStateManager.setManualDisconnect(guildId, false);
      state.connection.subscribe(state.player);
      logger.info('Guild ' + guildId + ' Connection Subscribed To Player');

      state.playbackMode = 'surah';
      const reciterKeys = Object.keys(global.reciters || {});
      const randomReciterKey = reciterKeys[Math.floor(Math.random() * reciterKeys.length)];
      state.currentReciter = randomReciterKey;
      const availableSurah = getAvailableSurahIndex(state);
      state.currentSurah = availableSurah;

      const reciterInfo = getReciterInfo(randomReciterKey);
      logger.info(
         'Guild ' +
            guildId +
            ' Bot Joined Voice Channel ' +
            voiceChannelId +
            ' With Reciter ' +
            reciterInfo.name +
            ' Has ' +
            reciterInfo.availableCount +
            ' Surahs Playing Surah ' +
            availableSurah,
      );

      await startPlayback(state, guildId);
      await global.saveRuntimeStates();

      const persistentState = persistentStateManager.getGuildState(guildId);
      persistentState.voiceChannelId = state.channelId;
      persistentState.playbackMode = state.playbackMode;
      persistentState.currentReciter = state.currentReciter;
      persistentState.currentSurahIndex = state.currentSurah - 1;
      persistentState.connectionStatus = true;
      persistentState.isPaused = false;
      persistentStateManager.updateGuildState(guildId, persistentState);
      global.saveRuntimeStates();

      if (!global.setupGuilds) global.setupGuilds = {};
      if (!global.setupGuilds[guildId]) {
         global.setupGuilds[guildId] = { voiceChannelId: voiceChannelId };
      }

      return { success: true, voiceChannelId };
   } catch (error) {
      logger.error('Error Joining Via Button In Guild ' + guildId, error);
      state.connection = null;
      state.channelId = null;
      return { success: false, error: ERRORS.JOIN_FAILED + error.message };
   }
}

module.exports.joinVoiceChannelHandler = joinVoiceChannelHandler;
