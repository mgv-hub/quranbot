require('pathlra-aliaser')();
module.exports = {
   name: 'دخول_قناة',
   description: 'الانضمام إلى غرفة صوتية محددة',
   options: [
      {
         name: 'قناة',
         description: 'اختر الغرفة الصوتية',
         type: 7,
         required: true,
         channel_types: [2],
      },
   ],
   async execute(interaction) {
      const imp = require('@loader-core_bootstrap');
      const guildId = interaction.guildId;
      const state = imp.getGuildState(guildId);
      if (!imp.isAuthorized(interaction, state, null)) {
         return interaction.reply({
            content: 'لازم يكون معاك اكسس ادمنستريتر',
            flags: 64,
         });
      }
      const selectedChannel = interaction.options.getChannel('قناة');
      if (!selectedChannel || selectedChannel.type !== imp.ChannelType.GuildVoice) {
         return interaction.reply({
            content: 'يرجى اختيار غرفة صوتية صالحة',
            flags: 64,
         });
      }
      const botPermissions = selectedChannel.permissionsFor(interaction.guild.members.me);
      if (!botPermissions.has(imp.PermissionsBitField.Flags.Connect)) {
         return interaction.reply({
            content: 'البوت ليس لديه الصلاحيات الكاملة للانضمام إلى هذه الغرفة الصوتية يرجى التحقق من الصلاحيات',
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
               imp.logger.info(`Error unsubscribing player in guild ${guildId}`);
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
            channelId: selectedChannel.id,
            guildId: guildId,
            adapterCreator: interaction.guild.voiceAdapterCreator,
            selfDeaf: true,
         });
         state.channelId = selectedChannel.id;
         state.connection.subscribe(state.player);
         if (state.playbackMode === 'surah') {
            imp.logger.info(
               `Guild ${guildId} Playing surah ${state.currentSurah} with reciter ${state.currentReciter}`,
            );
            const resource = await imp.createSurahResource(state, state.currentSurah - 1);
            state.player.play(resource);
         } else if (state.currentRadioUrl) {
            const activeUrl =
               global.radioHealthChecker?.getActiveRadioUrl(state.currentRadioUrl) || state.currentRadioUrl;
            imp.logger.info(`Guild ${guildId} Playing radio stream ${activeUrl}`);
            const resource = await imp.createRadioResource(activeUrl);
            state.player.play(resource);
            state.currentRadioUrl = activeUrl;
         }
         state.isPaused = false;
         state.pauseReason = null;
         global.saveRuntimeStates();
         const embed = {
            embeds: [
               {
                  color: 0x1e1f22,
                  title: `تم الانضمام إلى ${selectedChannel.name}`,
                  description: 'جاري تشغيل سورة عشوائية بقارئ عشوائي استخدم تحكم لعرض لوحة التحكم',
               },
            ],
         };
         await interaction.editReply(embed);
         imp.logger.info(`Guild ${guildId} joined channel ${selectedChannel.id}`);
      } catch (error) {
         imp.logger.error(`Joining Error ${error.message}`);
         if (error.message.includes('No compatible encryption modes')) {
            await interaction.editReply({
               content: 'تعذر الاتصال بخادم الصوت الحالي يرجى المحاولة لاحقا أو التواصل مع الدعم الفني',
               flags: 64,
            });
         } else {
            await interaction.editReply({
               content: 'حدث خطأ أثناء الانضمام إلى القناة الصوتية سيتم الحفاظ على الاتصال الحالي',
               flags: 64,
            });
         }
      }
   },
};
