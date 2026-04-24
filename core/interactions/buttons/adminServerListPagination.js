require('pathlra-aliaser')();
const {
   EmbedBuilder,
   ButtonBuilder,
   ButtonStyle,
   ActionRowBuilder,
   StringSelectMenuBuilder,
   StringSelectMenuOptionBuilder,
} = require('discord.js');
const logger = require('@logger');
module.exports = {
   customId: 'admin_server_pagination',
   async execute(interaction) {
      const userId = interaction.user.id;
      const isSpecialUser = global.SPE_USER_IDS.includes(userId);
      if (!isSpecialUser) {
         return interaction.reply({
            content: 'This feature is available for the developer only',
            flags: 64,
         });
      }
      try {
         await interaction.deferUpdate();
         const client = global.client;
         const guilds = Array.from(client.guilds.cache.values());
         if (guilds.length === 0) {
            return interaction.followUp({
               content: 'Bot is not in any server',
               flags: 64,
            });
         }
         const itemsPerPage = 25;
         const totalPages = Math.ceil(guilds.length / itemsPerPage);
         let currentPage = 0;
         if (interaction.customId === 'admin_prev_servers') {
            const pageField = interaction.message.embeds[0]?.fields?.find(
               (f) => f.name === 'Page',
            );
            if (pageField && pageField.value) {
               const match = pageField.value.match(/(\d+)\/(\d+)/);
               if (match) {
                  currentPage = parseInt(match[1], 10) - 1;
               }
            }
            currentPage = Math.max(0, currentPage - 1);
         } else if (interaction.customId === 'admin_next_servers') {
            const pageField = interaction.message.embeds[0]?.fields?.find(
               (f) => f.name === 'Page',
            );
            if (pageField && pageField.value) {
               const match = pageField.value.match(/(\d+)\/(\d+)/);
               if (match) {
                  currentPage = parseInt(match[1], 10) - 1;
               }
            }
            currentPage = Math.min(totalPages - 1, currentPage + 1);
         } else if (interaction.customId === 'admin_refresh_servers') {
            currentPage = 0;
         }
         const startIndex = currentPage * itemsPerPage;
         const endIndex = Math.min(startIndex + itemsPerPage, guilds.length);
         const currentGuilds = guilds.slice(startIndex, endIndex);
         const guildOptions = currentGuilds.map((guild, index) => {
            const globalIndex = startIndex + index + 1;
            return new StringSelectMenuOptionBuilder()
               .setLabel(`${globalIndex}. ${guild.name.substring(0, 95)}`)
               .setValue(guild.id)
               .setDescription(`${guild.memberCount} members`);
         });
         const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('admin_select_guild')
            .setPlaceholder('Select a server to view details')
            .addOptions(guildOptions);
         const selectRow = new ActionRowBuilder().addComponents(selectMenu);
         const navigationRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
               .setCustomId('admin_back_to_panel')
               .setLabel('Back to Panel')
               .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
               .setCustomId('admin_prev_servers')
               .setLabel('Previous')
               .setStyle(ButtonStyle.Secondary)
               .setDisabled(currentPage === 0),
            new ButtonBuilder()
               .setCustomId('admin_next_servers')
               .setLabel('Next')
               .setStyle(ButtonStyle.Secondary)
               .setDisabled(currentPage >= totalPages - 1),
            new ButtonBuilder()
               .setCustomId('admin_refresh_servers')
               .setLabel('Refresh')
               .setStyle(ButtonStyle.Secondary),
         );
         const embed = new EmbedBuilder()
            .setColor(0x1e1f22)
            .setTitle('Bot Server List')
            .setDescription(
               `**Total Servers: ${guilds.length}**\nSelect a server from the list below to view details and manage it`,
            )
            .addFields(
               { name: 'Page', value: `${currentPage + 1}/${totalPages}`, inline: true },
               { name: 'Showing', value: `${startIndex + 1}-${endIndex}`, inline: true },
               {
                  name: 'Total Members',
                  value: `${guilds.reduce((acc, g) => acc + g.memberCount, 0)}`,
                  inline: true,
               },
            );
         await interaction.editReply({
            embeds: [embed],
            components: [selectRow, navigationRow],
         });
      } catch (error) {
         logger.error('Error In Admin Server Pagination', error);
         try {
            if (!interaction.replied && !interaction.deferred) {
               await interaction.deferUpdate().catch(() => {});
            }
            await interaction
               .followUp({
                  content: 'حدث خطأ ' + error.message,
                  flags: 64,
               })
               .catch(() => {});
         } catch (replyError) {
            logger.error('Error Replying To Interaction', replyError);
         }
      }
   },
};
