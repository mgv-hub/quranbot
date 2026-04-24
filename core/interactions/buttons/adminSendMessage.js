require('pathlra-aliaser')();
const {
   ModalBuilder,
   TextInputBuilder,
   TextInputStyle,
   ActionRowBuilder,
} = require('discord.js');
const logger = require('@logger');

module.exports = {
   customId: 'admin_send_message',
   async execute(interaction) {
      const userId = interaction.user.id;
      const isSpecialUser = global.SPE_USER_IDS.includes(userId);

      if (!isSpecialUser) {
         return interaction.reply({
            content: 'This feature is available for the developer only',
            flags: 64,
         });
      }

      const modal = new ModalBuilder()
         .setCustomId('admin_send_msg_modal')
         .setTitle('Send Administrative Message');

      const guildIdInput = new TextInputBuilder()
         .setCustomId('admin_msg_guild_id')
         .setLabel('Enter Server ID or Control Channel ID')
         .setStyle(TextInputStyle.Short)
         .setRequired(true)
         .setMaxLength(100)
         .setPlaceholder('Example: 789262675892240396');

      const messageInput = new TextInputBuilder()
         .setCustomId('admin_msg_content')
         .setLabel('Enter the message you want to send')
         .setStyle(TextInputStyle.Paragraph)
         .setRequired(true)
         .setMaxLength(2000)
         .setPlaceholder('Type your message here...');

      const firstActionRow = new ActionRowBuilder().addComponents(guildIdInput);
      const secondActionRow = new ActionRowBuilder().addComponents(messageInput);

      modal.addComponents(firstActionRow, secondActionRow);
      await interaction.showModal(modal);
   },
};
