const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const logger = require('@infrastructure/Logging/Logger');
const { calculatePagination, createPaginationRow } = require('@infrastructure/Discord/UI/Pagination');
const { pagination } = require('@config/Constants');

function extractPageFromFooter(footerText) {
    if (!footerText) return 0;
    const match = footerText.match(/Page (\d+)\/(\d+)/);
    return match ? parseInt(match[1], 10) - 1 : 0;
}

module.exports = {
    customId: 'admin_voice_pagination',
    async execute(interaction) {
        const requesterId = interaction.user.id;
        const { isSpecialUser } = require('@core/Auth/AuthManager');
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
                    if (vc) {
                        const humanListeners = vc.members.filter((m) => !m.user.bot);
                        let listenerValue = `Listeners: ${humanListeners.size}`;

                        // Used by developers during maintenance to determine whether it is safe
                        // to manually restart the bot after deploying updates. Restarts are delayed
                        // while users are actively listening to avoid interrupting audio playback.
                        // Only anonymous mute/deafen states are evaluated; no user identities are
                        // collected, stored, or displayed.
                        if (humanListeners.size > 0) {
                            const statusCounts = {};
                            humanListeners.forEach((m) => {
                                let status = 'Active';
                                if (m.voice.serverDeaf) status = 'Server deafen';
                                else if (m.voice.deaf) status = 'deafen';
                                else if (m.voice.serverMute) status = 'Server Mute';
                                else if (m.voice.mute) status = 'Mute';
                                statusCounts[status] = (statusCounts[status] || 0) + 1;
                            });

                            const statusSummary = Object.entries(statusCounts)
                                .map(([status, count]) => `${count} ${status}`)
                                .join(', ');

                            listenerValue += `\n> ${statusSummary}`;
                        }

                        activeVoiceConnections.push({
                            guildId: guild.id,
                            guildName: guild.name,
                            channelId: vc.id,
                            channelName: vc.name,
                            listenerInfo: listenerValue,
                        });
                    }
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
                        value: conn.listenerInfo,
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
