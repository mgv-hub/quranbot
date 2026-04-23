require('pathlra-aliaser')();
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const logger = require('@logger');

module.exports = {
   customId: 'admin_panel',
   async execute(interaction) {
      const userId = interaction.user.id;
      const isSpecialUser = global.SPE_USER_IDS.includes(userId);
      if (!isSpecialUser) {
         return interaction.reply({
            content: 'This panel is available for the developer only',
            flags: 64,
         });
      }
      const client = global.client;
      const guilds = client.guilds.cache;
      const totalMembers = guilds.reduce((acc, guild) => acc + guild.memberCount, 0);
      const voiceCount = getConnectedVoiceCount();
      const adminEmbed = new EmbedBuilder()
         .setColor(0x1e1f22)
         .setTitle('Developer Control Panel')
         .setDescription('**General Bot Statistics**')
         .addFields(
            { name: 'Server Count', value: `${guilds.size}`, inline: true },
            { name: 'Total Members', value: `${totalMembers}`, inline: true },
            { name: 'Voice Channels', value: `${voiceCount}`, inline: true },
            { name: 'Uptime', value: formatUptime(client.uptime), inline: true },
         );
      const adminRow1 = new ActionRowBuilder().addComponents(
         new ButtonBuilder().setCustomId('admin_server_list').setLabel('Server List').setStyle(ButtonStyle.Secondary),
         new ButtonBuilder()
            .setCustomId('admin_voice_channels')
            .setLabel('Voice Channels')
            .setStyle(ButtonStyle.Secondary),
         new ButtonBuilder().setCustomId('admin_send_message').setLabel('Send Message').setStyle(ButtonStyle.Secondary),
         new ButtonBuilder().setCustomId('admin_bot_stats').setLabel('Bot Statistics').setStyle(ButtonStyle.Secondary),
      );
      const adminRow2 = new ActionRowBuilder().addComponents(
         new ButtonBuilder()
            .setCustomId('admin_response_modal')
            .setLabel('Reply to Complaint')
            .setStyle(ButtonStyle.Secondary),
         new ButtonBuilder().setCustomId('admin_close_panel').setLabel('Close').setStyle(ButtonStyle.Secondary),
      );
      await interaction.reply({
         embeds: [adminEmbed],
         components: [adminRow1, adminRow2],
         flags: 64,
      });
   },
};

function formatUptime(ms) {
   const seconds = Math.floor(ms / 1000);
   const minutes = Math.floor(seconds / 60);
   const hours = Math.floor(minutes / 60);
   const days = Math.floor(hours / 24);
   if (days > 0) return `${days}d ${hours % 24}h`;
   if (hours > 0) return `${hours}h ${minutes % 60}m`;
   if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
   return `${seconds}s`;
}

function getConnectedVoiceCount() {
   let count = 0;
   const client = global.client;
   if (!client) return 0;
   client.guilds.cache.forEach((guild) => {
      if (guild.members.me?.voice?.channelId) {
         count++;
      }
   });
   return count;
}
