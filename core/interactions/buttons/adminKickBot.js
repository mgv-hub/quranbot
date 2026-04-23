require('pathlra-aliaser')();
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const logger = require('@logger');

module.exports = {
   customId: 'admin_kick_bot',
   async execute(interaction) {
      const userId = interaction.user.id;
      const isSpecialUser = global.SPE_USER_IDS.includes(userId);

      if (!isSpecialUser) {
         return interaction.reply({
            content: 'This feature is available for the developer only',
            flags: 64,
         });
      }

      const customId = interaction.customId;
      const guildId = customId.replace('admin_kick_bot_', '');

      const client = global.client;
      const guild = client.guilds.cache.get(guildId);

      if (!guild) {
         return interaction.reply({
            content: 'Server not found',
            flags: 64,
         });
      }

      const confirmRow = new ActionRowBuilder().addComponents(
         new ButtonBuilder()
            .setCustomId(`admin_confirm_kick_${guildId}`)
            .setLabel('Confirm Leave')
            .setStyle(ButtonStyle.Secondary),
         new ButtonBuilder().setCustomId('admin_cancel_kick').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
      );

      const confirmEmbed = new EmbedBuilder()
         .setColor(0x1e1f22)
         .setTitle('Confirm Bot Leave')
         .setDescription(
            `**Are you sure you want to remove the bot from:**\n\n${guild.name}\n${guild.memberCount} members\n\`${guild.id}\``,
         )
         .addFields({
            name: 'Warning',
            value: 'This action cannot be undone. All bot settings for this server will be deleted.',
            inline: false,
         });
      await interaction.reply({
         embeds: [confirmEmbed],
         components: [confirmRow],
         flags: 64,
      });
   },
};
