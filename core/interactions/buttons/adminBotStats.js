require('pathlra-aliaser')();
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const logger = require('@logger');
const os = require('os');

module.exports = {
   customId: 'admin_bot_stats',
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

      const client = global.client;
      const guilds = client.guilds.cache;
      const totalMembers = guilds.reduce((acc, guild) => acc + guild.memberCount, 0);
      const memoryUsage = process.memoryUsage();
      const rss = (memoryUsage.rss / 1024 / 1024).toFixed(2);
      const platform = os.platform();
      const nodeVersion = process.version;

      const statsEmbed = new EmbedBuilder()
         .setColor(0x1e1f22)
         .setTitle('Detailed Bot Statistics')
         .setDescription('**Bot and Server Information**')
         .addFields(
            { name: 'Server Count', value: `${guilds.size}`, inline: true },
            { name: 'Total Members', value: `${totalMembers}`, inline: true },
            {
               name: 'User',
               value: `${totalMembers - guilds.reduce((acc, g) => acc + g.members.cache.filter((m) => m.user.bot).size, 0)}`,
               inline: true,
            },
            { name: 'Platform', value: `${platform}`, inline: true },
            { name: 'Node.js', value: `${nodeVersion}`, inline: true },
            { name: 'Uptime', value: formatUptime(client.uptime), inline: true },
            {
               name: 'Start Date',
               value: `<t:${Math.floor((Date.now() - client.uptime) / 1000)}:R>`,
               inline: true,
            },
            { name: 'Protection System', value: 'Active', inline: true },
         );
      const statsRow = new ActionRowBuilder().addComponents(
         new ButtonBuilder()
            .setCustomId('admin_back_to_panel')
            .setLabel('Back to Panel')
            .setStyle(ButtonStyle.Secondary),
         new ButtonBuilder().setCustomId('admin_refresh_stats').setLabel('Refresh').setStyle(ButtonStyle.Secondary),
      );

      await interaction.followUp({
         embeds: [statsEmbed],
         components: [statsRow],
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
