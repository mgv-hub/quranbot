require('pathlra-aliaser')();
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const logger = require('@logger');
module.exports = {
   customId: 'admin_response_modal',
   async execute(interaction) {
      try {
         const userId = interaction.user.id;
         const isSpecialUser = global.SPE_USER_IDS.includes(userId);
         if (!isSpecialUser) {
            return interaction.reply({
               content: 'هذا الامر متاح فقط للمطور',
               flags: 64,
            });
         }
         const modal = new ModalBuilder()
            .setCustomId('admin_response_modal_submit')
            .setTitle('رد على شكوى أو إرسال رسالة');
         const guildIdInput = new TextInputBuilder()
            .setCustomId('admin_guild_id')
            .setLabel('معرف السيرفر أو قناة التحكم اختياري')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(100)
            .setPlaceholder('مثال 789262675892240396 اتركه فارغا اذا اردت ارسال على الخاص فقط');
         const roleLevelInput = new TextInputBuilder()
            .setCustomId('admin_role_level')
            .setLabel('أدخل صلاحيك في فريق البوت')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(50)
            .setPlaceholder('مثال Developer Admin Owner');
         const targetUserInput = new TextInputBuilder()
            .setCustomId('admin_target_user_id')
            .setLabel('معرف المستخدم لإرسال الرد على الخاص اختياري')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(100)
            .setPlaceholder('مثال 123456789012345678 اتركه فارغا اذا اردت ارسال للقناة فقط');
         const messageInput = new TextInputBuilder()
            .setCustomId('admin_message')
            .setLabel('أدخل الرسالة التي تريد إرسالها')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(2000)
            .setPlaceholder('اكتب رسالتك هنا');
         const firstActionRow = new ActionRowBuilder().addComponents(guildIdInput);
         const secondActionRow = new ActionRowBuilder().addComponents(roleLevelInput);
         const thirdActionRow = new ActionRowBuilder().addComponents(targetUserInput);
         const fourthActionRow = new ActionRowBuilder().addComponents(messageInput);
         modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);
         await interaction.showModal(modal);
      } catch (error) {
         logger.error('Error showing admin response modal', error);
         try {
            await interaction.reply({
               content: 'حدث خطأ في فتح النموذج',
               flags: 64,
            });
         } catch (replyError) {
            logger.error('Failed to send error reply', replyError);
         }
      }
   },
};
