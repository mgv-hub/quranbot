require('pathlra-aliaser')();
module.exports = {
   name: 'تحكم',
   description: 'عرض لوحة التحكم',
   async execute(interaction) {
      const imp = require('@loader-core_bootstrap');
      const guildId = interaction.guildId;
      const state = imp.getGuildState(guildId);
      try {
         if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply().catch(() => {});
         }
         if (!global.surahNames || global.surahNames.length === 0) {
            return interaction.editReply({
               content: 'جاري تحميل البيانات يرجى الانتظار قليلاً ثم استخدم الأمر مرة أخرى',
            });
         }
         if (!global.reciters || Object.keys(global.reciters).length === 0) {
            return interaction.editReply({
               content: 'جاري تحميل القراء يرجى الانتظار قليلاً ثم استخدم الأمر مرة أخرى',
            });
         }
         const embed = imp.createControlEmbed(state, guildId);
         let components = [];
         if (state.playbackMode === 'surah') {
            components.push(imp.createReciterRow(state));
            components.push(imp.createSelectRow(state));
         }
         components.push(imp.createButtonRow(state));
         const navRows = imp.createNavigationRow(state, guildId);
         for (const row of navRows) {
            if (row.components && row.components.length > 0 && row.components.length <= 5) {
               if (components.length < 5) {
                  components.push(row);
               }
            }
         }
         components = components.slice(0, 5);
         const message = await interaction.editReply({
            embeds: [embed],
            components: components,
            fetchReply: true,
         });
         await imp.saveControlId(guildId, interaction.channelId, message.id);
      } catch (error) {
         const logger = require('@logger');
         logger.error('Error in control command', error);
         await interaction.editReply('حدث خطأ أثناء تحميل لوحة التحكم');
      }
   },
};
