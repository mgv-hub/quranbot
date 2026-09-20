const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { isSpecialUser } = require('@core/Auth/AuthManager');
const statusManager = require('@state/StatusManager');
const logger = require('@infrastructure/Logging/Logger');

module.exports = {
    customId: 'admin_status_modal',
    async execute(interaction) {
        if (!isSpecialUser(interaction.user.id)) {
            return interaction.reply({ content: 'This feature is available for the developers only', flags: 64 });
        }

        const customId = interaction.customId;
        const currentStatus = statusManager.getStatus();

        if (customId === 'admin_status_text_modal') {
            const modal = new ModalBuilder().setCustomId('admin_status_text_submit').setTitle('Set Status Text');

            const textField = new TextInputBuilder()
                .setCustomId('status_text')
                .setLabel('Enter the status text')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false)
                .setMaxLength(128)
                .setPlaceholder('e...');

            if (currentStatus.activityText) {
                textField.setValue(currentStatus.activityText);
            }

            const row = new ActionRowBuilder().addComponents(textField);
            modal.addComponents(row);
            await interaction.showModal(modal);
        } else if (customId === 'admin_voice_status_modal') {
            const modal = new ModalBuilder().setCustomId('admin_voice_status_submit').setTitle('Set Voice Status');

            const textField = new TextInputBuilder()
                .setCustomId('voice_status_text')
                .setLabel('Enter the voice status text')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false)
                .setMaxLength(500)
                .setPlaceholder('e...');

            if (currentStatus.voiceStatus) {
                textField.setValue(currentStatus.voiceStatus);
            }

            const row = new ActionRowBuilder().addComponents(textField);
            modal.addComponents(row);
            await interaction.showModal(modal);
        } else if (customId === 'admin_status_text_submit') {
            await interaction.deferReply({ flags: 64 });
            const text = interaction.fields.getTextInputValue('status_text')?.trim() || '';

            if (text) {
                await statusManager.updateStatus({ activityText: text });
                logger.info(`Admin ${interaction.user.tag} set status text: ${text}`);
                await interaction.editReply({ content: `Status text updated to: **${text}**` });
            } else {
                await statusManager.updateStatus({ activityText: null });
                logger.info(`Admin ${interaction.user.tag} cleared status text`);
                await interaction.editReply({ content: 'Status text cleared. Bot will use default status.' });
            }
        } else if (customId === 'admin_voice_status_submit') {
            await interaction.deferReply({ flags: 64 });
            const text = interaction.fields.getTextInputValue('voice_status_text')?.trim() || '';

            if (text) {
                await statusManager.updateStatus({ voiceStatus: text });
                logger.info(`Admin ${interaction.user.tag} set voice status: ${text}`);
                await interaction.editReply({ content: `Voice status updated to: **${text}**` });
            } else {
                await statusManager.updateStatus({ voiceStatus: null });
                logger.info(`Admin ${interaction.user.tag} cleared voice status`);
                await interaction.editReply({ content: 'Voice status cleared. Bot will use default voice status.' });
            }
        }
    },
};
