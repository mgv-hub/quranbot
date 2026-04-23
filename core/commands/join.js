require('pathlra-aliaser')();
module.exports = {
   name: 'دخول',
   description: 'الانضمام إلى الروم الصوتي المعد من الإعداد',
   async execute(interaction) {
      const imp = require('@loader-core_bootstrap');
      const persistentStateManager = require('@PersistentStateManager-core_state');
      const logger = require('@logger');
      const guildId = interaction.guildId;
      const state = imp.getGuildState(guildId);
      if (!imp.isAuthorized(interaction, state, null)) {
         return interaction.reply({
            content: 'تتطلب هذه العملية امتلاك صلاحيات المسؤول (Administrator)',
            flags: 64,
         });
      }

      const setupData = global.setupGuilds ? global.setupGuilds[guildId] : null;
      if (!setupData || !setupData.voiceChannelId) {
         return interaction.reply({
            content: 'لم يتم إعداد فئة القرآن بعد استخدم امر الإعداد أولا',
            flags: 64,
         });
      }

      const voiceChannelId = setupData.voiceChannelId;
      const voiceChannel =
         interaction.guild.channels.cache.get(voiceChannelId) ||
         (await interaction.guild.channels.fetch(voiceChannelId).catch(() => null));
      if (!voiceChannel || voiceChannel.type !== imp.ChannelType.GuildVoice) {
         return interaction.reply({
            content: 'القناة الصوتية المعدة غير موجودة أو غير صالحة يرجى إعادة الإعداد',
            flags: 64,
         });
      }

      const botPermissions = voiceChannel.permissionsFor(interaction.guild.members.me);
      if (!botPermissions.has(imp.PermissionsBitField.Flags.Connect)) {
         return interaction.reply({
            content: 'البوت ليس لديه الصلاحيات الكاملة للانضمام إلى هذه الغرفة الصوتية',
            flags: 64,
         });
      }

      try {
         if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply().catch(() => {});
         }
         if (state.connection && !state.connection.destroyed) {
            try {
               state.connection.unsubscribe(state.player);
               state.connection.destroy();
            } catch (error) {
               logger.info(`Error unsubscribing player in guild ${guildId}`);
            }
            state.connection = null;
            state.channelId = null;
         }

         state.isPaused = false;
         state.pauseReason = null;
         state.playbackMode = state.playbackMode || 'surah';
         const reciterKeys = Object.keys(global.reciters || {});
         const randomReciterKey = reciterKeys[Math.floor(Math.random() * reciterKeys.length)];
         state.currentReciter = randomReciterKey;
         state.currentSurah = Math.floor(Math.random() * 114) + 1;

         state.connection = await imp.joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guildId,
            adapterCreator: interaction.guild.voiceAdapterCreator,
            selfDeaf: true,
         });

         state.channelId = voiceChannel.id;
         state.connection.subscribe(state.player);
         if (state.playbackMode === 'surah') {
            logger.info(`Guild ${guildId} Playing surah ${state.currentSurah} with reciter ${state.currentReciter}`);
            const resource = await imp.createSurahResource(state, state.currentSurah - 1);
            state.player.play(resource);
         } else if (state.currentRadioUrl) {
            const activeUrl =
               global.radioHealthChecker?.getActiveRadioUrl(state.currentRadioUrl) || state.currentRadioUrl;
            logger.info(`Guild ${guildId} Playing radio stream ${activeUrl}`);
            const resource = await imp.createRadioResource(activeUrl);
            state.player.play(resource);
            state.currentRadioUrl = activeUrl;
         }

         state.isPaused = false;
         state.pauseReason = null;
         global.saveRuntimeStates();
         const persistentState = persistentStateManager.getGuildState(guildId);
         persistentState.voiceChannelId = state.channelId;
         persistentState.playbackMode = state.playbackMode;
         persistentState.currentReciter = state.currentReciter;
         persistentState.currentSurahIndex = state.currentSurah - 1;
         persistentState.connectionStatus = true;
         persistentStateManager.updateGuildState(guildId, persistentState);
         await interaction.editReply({
            content: `تم الانضمام إلى ${voiceChannel.name} جاري التشغيل`,
            flags: 64,
         });
         logger.info(`Guild ${guildId} joined channel ${voiceChannel.id}`);
      } catch (error) {
         logger.error(`Joining Error ${error.message}`);
         if (error.message.includes('No compatible encryption modes')) {
            await interaction.editReply({
               content: 'تعذر الاتصال بخادم الصوت الحالي يرجى المحاولة لاحقا',
               flags: 64,
            });
         } else {
            await interaction.editReply({
               content: 'حدث خطأ أثناء الانضمام إلى القناة الصوتية',
               flags: 64,
            });
         }
      }
   },
};
