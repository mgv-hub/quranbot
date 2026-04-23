require('pathlra-aliaser')();
module.exports = {
   name: 'leave',
   description: 'Disconnect from the voice channel',
   async execute(interaction) {
      const imp = require('@loader-core_bootstrap');
      const persistentStateManager = require('@PersistentStateManager-core_state');
      const guildId = interaction.guildId;
      const state = imp.getGuildState(guildId);
      if (!imp.isAuthorized(interaction, state, null)) {
         return interaction.editReply({
            content: 'تتطلب هذه العملية امتلاك صلاحيات المسؤول (Administrator)',
            flags: 64,
         });
      }
      if (state.connection && !state.connection.destroyed) {
         state.player.stop();
         state.isPaused = true;
         state.pauseReason = 'manual_leave';
         try {
            state.connection.destroy();
         } catch (error) {
            imp.logger.warn(`Error destroying connection in guild ${guildId}`, error);
         }
         state.connection = null;
         state.channelId = null;
         persistentStateManager.setManualDisconnect(guildId, true);
         imp.updatePersistentState(guildId, state);
         await interaction.editReply({
            content: 'تم الخروج من الغرفة الصوتية بنجاح',
            flags: 64,
         });
      } else {
         await interaction.editReply({
            content: 'البوت غير موجود في روم صوتي حالياً',
            flags: 64,
         });
      }
   },
};
