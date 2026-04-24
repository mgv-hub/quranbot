require('pathlra-aliaser')();
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const logger = require('@logger');

module.exports = {
   customId: 'admin_select_guild',
   async execute(interaction) {
      const userId = interaction.user.id;
      const isSpecialUser = global.SPE_USER_IDS.includes(userId);

      if (!isSpecialUser) {
         return interaction.reply({
            content: 'This feature is available for the developer only',
            flags: 64,
         });
      }

      await interaction.deferUpdate();

      const selectedGuildId = interaction.values[0];
      const client = global.client;
      const guild = client.guilds.cache.get(selectedGuildId);

      if (!guild) {
         return interaction.followUp({
            content: 'Server not found',
            flags: 64,
         });
      }
      const owner = await guild.fetchOwner().catch(() => null);

      const guildEmbed = new EmbedBuilder()
         .setColor(0x1e1f22)
         .setTitle(guild.name)
         .setThumbnail(guild.iconURL({ size: 256 }) || null)
         .setDescription(`**Server Information**`)
         .addFields(
            { name: 'ID', value: `\`${guild.id}\``, inline: true },
            { name: 'Owner', value: owner ? `<@${owner.id}>` : 'Unknown', inline: true },
            {
               name: 'Created At',
               value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
               inline: true,
            },
            { name: 'Total Members', value: `${guild.memberCount}`, inline: true },
         );
      const actionRow = new ActionRowBuilder().addComponents(
         new ButtonBuilder()
            .setCustomId(`admin_send_msg_${guild.id}`)
            .setLabel('Send Message')
            .setStyle(ButtonStyle.Secondary),
         new ButtonBuilder()
            .setCustomId(`admin_kick_bot_${guild.id}`)
            .setLabel('Kick Bot')
            .setStyle(ButtonStyle.Secondary),
         new ButtonBuilder()
            .setCustomId('admin_back_to_servers')
            .setLabel('Back to List')
            .setStyle(ButtonStyle.Secondary),
         new ButtonBuilder()
            .setCustomId('admin_back_to_panel')
            .setLabel('Control Panel')
            .setStyle(ButtonStyle.Secondary),
      );

      await interaction.followUp({
         embeds: [guildEmbed],
         components: [actionRow],
         flags: 64,
      });
   },
};
