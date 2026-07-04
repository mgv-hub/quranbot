const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const logger = require('@logging/logger');
const { isSpecialUser } = require('@auth/auth-manager');

module.exports = {
    customId: 'admin_send_message',
    async execute(interaction) {
        if (!isSpecialUser(interaction.user.id)) {
            return interaction.reply({
                content: 'This feature is available for the developers only',
                flags: 64,
            });
        }
        const broadcastModal = new ModalBuilder().setCustomId('admin_send_msg_modal').setTitle('Send Administrative Message');
        const targetIdField = new TextInputBuilder()
            .setCustomId('admin_msg_guild_id')
            .setLabel('Enter Server ID or Control Channel ID')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(100)
            .setPlaceholder('Example: 789262675892240396');
        const messageContentField = new TextInputBuilder()
            .setCustomId('admin_msg_content')
            .setLabel('Enter the message you want to send')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(2000)
            .setPlaceholder('Type your message here...');
        const targetRow = new ActionRowBuilder().addComponents(targetIdField);
        const contentRow = new ActionRowBuilder().addComponents(messageContentField);
        broadcastModal.addComponents(targetRow, contentRow);
        await interaction.showModal(broadcastModal);
    },
};
