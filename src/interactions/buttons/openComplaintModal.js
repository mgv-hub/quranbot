const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const logger = require('@logging/logger');

module.exports = {
    customId: 'open_complaint_modal',

    async execute(interaction) {
        try {
            // Initialize the complaint/feedback submission modal
            const complaintModal = new ModalBuilder().setCustomId('complaint_modal').setTitle('تقديم شكوى او اقتراح');

            // Primary reason for feedback (required)
            const reasonField = new TextInputBuilder()
                .setCustomId('complaint_reason')
                .setLabel('سبب المشكلة أو اقتراحك')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(1000);

            // Optional user suggestion or proposed fix
            const suggestionField = new TextInputBuilder()
                .setCustomId('complaint_suggestion')
                .setLabel('اقتراحك أو الحل من وجهة نظرك')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false)
                .setMaxLength(1000);

            // Brief overall experience comment (required)
            const experienceField = new TextInputBuilder()
                .setCustomId('complaint_experience')
                .setLabel('تجربتك مع البوت بشكل عام')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(100);

            // Build form rows and attach to modal
            const reasonRow = new ActionRowBuilder().addComponents(reasonField);
            const suggestionRow = new ActionRowBuilder().addComponents(suggestionField);
            const experienceRow = new ActionRowBuilder().addComponents(experienceField);

            complaintModal.addComponents(reasonRow, suggestionRow, experienceRow);

            await interaction.showModal(complaintModal);
        } catch (err) {
            logger.error('Error showing complaint modal', err);

            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: 'حدث خطأ في فتح النموذج',
                        flags: 64,
                    });
                }
            } catch (replyErr) {
                logger.error('Failed to send error reply', replyErr);
            }
        }
    },
};
