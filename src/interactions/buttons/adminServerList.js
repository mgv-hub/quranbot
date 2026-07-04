const {
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} = require('discord.js');
const logger = require('@logging/logger');
const { calculatePagination, createPaginationRow } = require('@ui/pagination');
const { isSpecialUser } = require('@auth/auth-manager');
// Import pagination limits from centralized config
const { pagination } = require('@config/constants');

module.exports = {
    customId: 'admin_server_list',
    async execute(interaction) {
        if (!isSpecialUser(interaction.user.id)) {
            return interaction.reply({
                content: 'This feature is available for the developers only',
                flags: 64,
            });
        }
        await interaction.deferUpdate();
        const botClient = global.client;
        const allGuilds = Array.from(botClient.guilds.cache.values());
        if (allGuilds.length === 0) {
            return interaction.followUp({ content: 'Bot is not in any server', flags: 64 });
        }
        // Use centralized constant
        const ITEMS_PER_PAGE = pagination.default_items; // 25
        const paginationData = calculatePagination(allGuilds.length, 0, ITEMS_PER_PAGE);
        const pagedGuilds = allGuilds.slice(paginationData.startIndex, paginationData.endIndex);
        const menuOptions = pagedGuilds.map((guild, index) => {
            const globalIndex = paginationData.startIndex + index + 1;
            return new StringSelectMenuOptionBuilder()
                .setLabel(`${globalIndex}. ${guild.name.substring(0, 95)}`)
                .setValue(guild.id)
                .setDescription(`${guild.memberCount} members`);
        });
        const serverSelect = new StringSelectMenuBuilder()
            .setCustomId('admin_select_guild')
            .setPlaceholder('Select a server to view details')
            .addOptions(menuOptions);
        const selectRow = new ActionRowBuilder().addComponents(serverSelect);
        const paginationRow = createPaginationRow(0, paginationData.totalPages, {
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
                `**Total Servers: ${allGuilds.length}**
Select a server from the list below to view details and manage it`,
            )
            .addFields(
                {
                    name: 'Page',
                    value: `${paginationData.currentPage + 1}/${paginationData.totalPages}`,
                    inline: true,
                },
                {
                    name: 'Showing',
                    value: `${paginationData.startIndex + 1}-${paginationData.endIndex}`,
                    inline: true,
                },
                {
                    name: 'Total Members',
                    value: `${allGuilds.reduce((sum, g) => sum + g.memberCount, 0)}`,
                    inline: true,
                },
            );
        await interaction.followUp({
            embeds: [serverListEmbed],
            components: [selectRow, paginationRow],
            flags: 64,
        });
    },
};
