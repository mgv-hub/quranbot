const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const logger = require('@logging/logger');
const { isSpecialUser } = require('@auth/auth-manager');

module.exports = {
    customId: 'admin_response_modal',
    async execute(interaction) {
        try {
            if (!isSpecialUser(interaction.user.id)) {
                return interaction.reply({ content: 'هذا الامر متاح فقط للمطور', flags: 64 });
            }
            const responseModal = new ModalBuilder().setCustomId('admin_response_modal_submit').setTitle('رد على شكوى أو إرسال رسالة');
            const guildIdField = new TextInputBuilder()
                .setCustomId('admin_guild_id')
                .setLabel('معرف السيرفر أو قناة التحكم اختياري')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setMaxLength(100)
                .setPlaceholder('مثال 789262675892240396 اتركه فارغا اذا اردت ارسال على الخاص فقط');
            const roleField = new TextInputBuilder()
                .setCustomId('admin_role_level')
                .setLabel('أدخل صلاحيك في فريق البوت')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(50)
                .setPlaceholder('مثال Developer Admin Owner');
            const targetUserField = new TextInputBuilder()
                .setCustomId('admin_target_user_id')
                .setLabel('معرف المستخدم لإرسال الرد على الخاص اختياري')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setMaxLength(100)
                .setPlaceholder('مثال 123456789012345678 اتركه فارغا اذا اردت ارسال للقناة فقط');
            const messageField = new TextInputBuilder()
                .setCustomId('admin_message')
                .setLabel('أدخل الرسالة التي تريد إرسالها')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(2000)
                .setPlaceholder('اكتب رسالتك هنا');
            const guildRow = new ActionRowBuilder().addComponents(guildIdField);
            const roleRow = new ActionRowBuilder().addComponents(roleField);
            const targetRow = new ActionRowBuilder().addComponents(targetUserField);
            const messageRow = new ActionRowBuilder().addComponents(messageField);
            responseModal.addComponents(guildRow, roleRow, targetRow, messageRow);
            await interaction.showModal(responseModal);
        } catch (err) {
            logger.error('Error showing admin response modal', err);
            try {
                await interaction.reply({ content: 'حدث خطأ في فتح النموذج', flags: 64 });
            } catch (replyErr) {
                logger.error('Failed to send error reply', replyErr);
            }
        }
    },
};
