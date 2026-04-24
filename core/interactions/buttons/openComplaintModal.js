require('pathlra-aliaser')();
const {
   ModalBuilder,
   TextInputBuilder,
   TextInputStyle,
   ActionRowBuilder,
} = require('discord.js');
const logger = require('@logger');

module.exports = {
   customId: 'open_complaint_modal',
   async execute(interaction) {
      try {
         const modal = new ModalBuilder()
            .setCustomId('complaint_modal')
            .setTitle('تقديم شكوى او اقتراح');

         const reasonInput = new TextInputBuilder()
            .setCustomId('complaint_reason')
            .setLabel('سبب المشكلة أو اقتراحك')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000);

         const suggestionInput = new TextInputBuilder()
            .setCustomId('complaint_suggestion')
            .setLabel('اقتراحك أو الحل من وجهة نظرك')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setMaxLength(1000);

         const experienceInput = new TextInputBuilder()
            .setCustomId('complaint_experience')
            .setLabel('تجربتك مع البوت بشكل عام')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(100);

         const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
         const secondActionRow = new ActionRowBuilder().addComponents(suggestionInput);
         const thirdActionRow = new ActionRowBuilder().addComponents(experienceInput);

         modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

         await interaction.showModal(modal);
      } catch (error) {
         logger.error('Error showing complaint modal', error);
         try {
            if (!interaction.replied && !interaction.deferred) {
               await interaction.reply({
                  content: 'حدث خطأ في فتح النموذج',
                  flags: 64,
               });
            }
         } catch (replyError) {
            logger.error('Failed to send error reply', replyError);
         }
      }
   },
};
