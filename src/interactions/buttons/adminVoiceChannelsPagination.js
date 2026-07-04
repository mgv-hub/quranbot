const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const logger = require('@logging/logger');
const { calculatePagination, createPaginationRow } = require('@ui/pagination');
const { pagination } = require('@config/constants');

function extractPageFromFooter(footerText) {
    if (!footerText) return 0;
    const match = footerText.match(/Page (\d+)\/(\d+)/);
    return match ? parseInt(match[1], 10) - 1 : 0;
}

module.exports = {
    customId: 'admin_voice_pagination',
    async execute(interaction) {
        const requesterId = interaction.user.id;
        const { isSpecialUser } = require('@auth/auth-manager');
        if (!isSpecialUser(requesterId)) {
            return interaction.reply({
                content: 'This feature is available for the developers only',
                flags: 64,
            });
        }
        try {
            await interaction.deferUpdate();
            // Collect voice channels
            const activeVoiceConnections = [];
            global.client.guilds.cache.forEach((guild) => {
                if (guild.members.me?.voice?.channelId) {
                    const vc = guild.channels.cache.get(guild.members.me.voice.channelId);
                    if (vc)
                        activeVoiceConnections.push({
                            guildId: guild.id,
                            guildName: guild.name,
                            channelId: vc.id,
                            channelName: vc.name,
                        });
                }
            });
            if (activeVoiceConnections.length === 0) {
                return interaction.followUp({
                    content: 'Bot is not connected to any voice channel',
                    flags: 64,
                });
            }
            const ITEMS_PER_PAGE = pagination.voice_channels_items;
            let currentPageIndex = 0;
            if (interaction.message?.embeds?.[0]?.footer?.text) {
                currentPageIndex = extractPageFromFooter(interaction.message.embeds[0].footer.text);
            }
            // Initial render (or re-render logic can be abstracted further if needed)
            const renderList = (pageIndex) => {
                const paginationData = calculatePagination(activeVoiceConnections.length, pageIndex, ITEMS_PER_PAGE);
                const visibleChannels = activeVoiceConnections.slice(paginationData.startIndex, paginationData.endIndex);
                const voiceEmbed = new EmbedBuilder()
                    .setColor(0xfefdfe)
                    .setTitle('Active Voice Channels')
                    .setDescription(`**Total Voice Channels: ${activeVoiceConnections.length}**`);
                for (const conn of visibleChannels) {
                    voiceEmbed.addFields({
                        name: `${conn.guildName} - ${conn.channelName}`,
                        value: `\u200b`,
                        inline: false,
                    });
                }
                voiceEmbed.setFooter({
                    text: `Page ${paginationData.currentPage + 1}/${paginationData.totalPages}`,
                });
                const paginationRow = createPaginationRow(paginationData.currentPage, paginationData.totalPages, {
                    prevId: 'admin_prev_voice',
                    nextId: 'admin_next_voice',
                    extraComponents: [
                        new ButtonBuilder().setCustomId('admin_back_to_panel').setLabel('Back to Panel').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('admin_refresh_voice').setLabel('Refresh').setStyle(ButtonStyle.Secondary),
                    ],
                });
                return { embeds: [voiceEmbed], components: [paginationRow] };
            };
            if (interaction.customId === 'admin_prev_voice' || interaction.customId === 'admin_next_voice') {
                const delta = interaction.customId === 'admin_prev_voice' ? -1 : 1;
                const newPage = currentPageIndex + delta;
                await interaction.editReply(renderList(newPage));
            } else {
                await interaction.editReply(renderList(currentPageIndex));
            }
        } catch (error) {
            logger.error('Error In Admin Voice Channels', error);
            try {
                await interaction.followUp({ content: 'حدث خطأ ' + error.message, flags: 64 }).catch(() => {});
            } catch (replyErr) {
                logger.error('Error Replying', replyErr);
            }
        }
    },
};
