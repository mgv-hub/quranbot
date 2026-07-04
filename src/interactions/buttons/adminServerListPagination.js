const {
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} = require('discord.js');
const logger = require('@logging/logger');
const { calculatePagination, createPaginationRow } = require('@ui/pagination'); // Do not use pseudonyms at this time

module.exports = {
    customId: 'admin_server_pagination',
    async execute(interaction) {
        if (!global.SPE_USER_IDS.includes(interaction.user.id)) {
            return interaction.reply({
                content: 'This feature is available for the developers only',
                flags: 64,
            });
        }

        try {
            await interaction.deferUpdate();
            const serverList = Array.from(global.client.guilds.cache.values());
            if (serverList.length === 0) return interaction.followUp({ content: 'Bot is not in any server', flags: 64 });

            const ITEMS_PER_PAGE = 25;

            // Extract current page from embed
            const pageField = interaction.message.embeds[0]?.fields?.find((f) => f.name === 'Page');
            let currentPage = 0;
            if (pageField?.value) {
                const match = pageField.value.match(/(\d+)\/(\d+)/);
                if (match) currentPage = parseInt(match[1], 10) - 1;
            }

            const pagination = calculatePagination(serverList.length, currentPage, ITEMS_PER_PAGE);

            // Adjust page based on button clicked
            if (interaction.customId === 'admin_prev_servers') pagination.currentPage = Math.max(0, currentPage - 1);
            if (interaction.customId === 'admin_next_servers')
                pagination.currentPage = Math.min(pagination.totalPages - 1, currentPage + 1);

            // Re-calculate indices for the new page
            const updatedPagination = calculatePagination(serverList.length, pagination.currentPage, ITEMS_PER_PAGE);
            const visibleServers = serverList.slice(updatedPagination.startIndex, updatedPagination.endIndex);

            const menuOptions = visibleServers.map((server, index) => {
                const globalIndex = updatedPagination.startIndex + index + 1;
                return new StringSelectMenuOptionBuilder()
                    .setLabel(`${globalIndex}. ${server.name.substring(0, 95)}`)
                    .setValue(server.id)
                    .setDescription(`${server.memberCount} members`);
            });

            const serverSelect = new StringSelectMenuBuilder()
                .setCustomId('admin_select_guild')
                .setPlaceholder('Select a server to view details')
                .addOptions(menuOptions);

            const selectRow = new ActionRowBuilder().addComponents(serverSelect);

            const paginationRow = createPaginationRow(updatedPagination.currentPage, updatedPagination.totalPages, {
                prevId: 'admin_prev_servers',
                nextId: 'admin_next_servers',
                extraComponents: [
                    new ButtonBuilder().setCustomId('admin_back_to_panel').setLabel('Back to Panel').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('admin_refresh_servers').setLabel('Refresh').setStyle(ButtonStyle.Secondary),
                ],
            });

            const serverListEmbed = new EmbedBuilder()
                .setColor(0xfefdfe)
                .setTitle('Bot Server List')
                .setDescription(
                    `**Total Servers: ${serverList.length}**\nSelect a server from the list below to view details and manage it`,
                )
                .addFields(
                    {
                        name: 'Page',
                        value: `${updatedPagination.currentPage + 1}/${updatedPagination.totalPages}`,
                        inline: true,
                    },
                    {
                        name: 'Showing',
                        value: `${updatedPagination.startIndex + 1}-${updatedPagination.endIndex}`,
                        inline: true,
                    },
                    {
                        name: 'Total Members',
                        value: `${serverList.reduce((sum, s) => sum + s.memberCount, 0)}`,
                        inline: true,
                    },
                );

            await interaction.editReply({
                embeds: [serverListEmbed],
                components: [selectRow, paginationRow],
            });
        } catch (error) {
            logger.error('Error In Admin Server Pagination', error);
            try {
                await interaction.followUp({ content: 'حدث خطأ ' + error.message, flags: 64 }).catch(() => {});
            } catch (replyErr) {
                logger.error('Error Replying', replyErr);
            }
        }
    },
};
