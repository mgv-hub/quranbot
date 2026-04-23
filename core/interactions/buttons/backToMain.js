require('pathlra-aliaser')();
const { EmbedBuilder } = require('discord.js');
const logger = require('@logger');
const imp = require('@loader-core_bootstrap');
module.exports = {
   customId: 'back_to_main',
   async execute(interaction) {
      try {
         await interaction.deferUpdate().catch(() => {});
         const guildId = interaction.guildId;
         const state = imp.getGuildState(guildId);
         const embed = imp.createControlEmbed(state, guildId);
         let components = [];
         if (state.playbackMode === 'surah' || state.playbackMode === 'juz') {
            components.push(imp.createReciterRow(state));
            components.push(imp.createSelectRow(state));
         } else {
            components.push(imp.createRadioRow(state));
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
         await interaction
            .editReply({
               embeds: [embed],
               components: components,
            })
            .catch(async (err) => {
               logger.error('Error editing reply in back_to_main', err);
               await interaction
                  .followUp({
                     embeds: [embed],
                     components: components,
                     flags: 64,
                  })
                  .catch(() => {});
            });
      } catch (error) {
         logger.error('Error Executing Back To Main In Guild ' + interaction.guildId, error);
         try {
            if (!interaction.deferred && !interaction.replied) {
               await interaction.reply({
                  content: 'حدث خطأ في العودة للوحة التحكم',
                  flags: 64,
               });
            } else {
               await interaction.followUp({
                  content: 'حدث خطأ في العودة للوحة التحكم',
                  flags: 64,
               });
            }
         } catch (replyError) {
            logger.error('Failed to send error reply', replyError);
         }
      }
   },
};
