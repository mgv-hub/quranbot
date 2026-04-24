require('pathlra-aliaser')();
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('@logger');
module.exports = {
   customId: 'more_features',
   async execute(interaction) {
      try {
         await interaction.deferUpdate().catch(() => {});
         const embed = new EmbedBuilder()
            .setColor(0x1e1f22)
            .setTitle('المزيد من الميزات')
            .setDescription(
               '**الميزات الإضافية**\nسيتم إضافة خيارات جديدة في المستقبل. حالياً، يتوفر فقط زر مواقيت الصلاة.',
            );
         const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
               .setCustomId('prayer_times')
               .setLabel('مواقيت الصلاة')
               .setStyle(ButtonStyle.Secondary),
         );
         await interaction
            .followUp({
               embeds: [embed],
               components: [row],
               flags: 64,
            })
            .catch(async (err) => {
               logger.error('Error sending followUp in more_features', err);
            });
      } catch (error) {
         logger.error('Error In More Features Button', error);
         try {
            if (!interaction.deferred && !interaction.replied) {
               await interaction.reply({
                  content: 'حدث خطأ في تحميل الميزات الإضافية',
                  flags: 64,
               });
            } else {
               await interaction.followUp({
                  content: 'حدث خطأ في تحميل الميزات الإضافية',
                  flags: 64,
               });
            }
         } catch (replyError) {
            logger.error('Failed to send error reply', replyError);
         }
      }
   },
};
