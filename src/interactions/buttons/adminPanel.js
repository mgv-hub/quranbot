const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const formatTimeDuration = require('@helpers/time/formatUptime');
const logger = require('@logging/logger');
const { createStandardEmbed } = require('@ui/embedFactory');

// Count how many guilds the bot is currently connected to via voice
function getActiveVoiceConnections() {
    let activeCount = 0;
    const botClient = global.client;
    if (!botClient) return 0;
    botClient.guilds.cache.forEach((guild) => {
        if (guild.members.me?.voice?.channelId) {
            activeCount++;
        }
    });
    return activeCount;
}

module.exports = {
    customId: 'admin_panel',
    async execute(interaction) {
        const { isSpecialUser } = require('@auth/auth-manager');

        if (!isSpecialUser(interaction.user.id)) {
            return interaction.reply({
                content: 'This panel is available for the developer only',
                flags: 64,
            });
        }
        const botClient = global.client;
        const cachedGuilds = botClient.guilds.cache;
        // Calculate aggregate statistics
        const totalMemberCount = cachedGuilds.reduce((sum, guild) => sum + guild.memberCount, 0);
        const activeVoiceChannels = getActiveVoiceConnections();
        const formattedUptime = formatTimeDuration(botClient.uptime, 'en');

        const dashboardEmbed = createStandardEmbed()
            .setTitle('Developer Control Panel')
            .setDescription('**General Bot Statistics**')
            .addFields(
                { name: 'Server Count', value: `${cachedGuilds.size}`, inline: true },
                { name: 'Total Members', value: `${totalMemberCount}`, inline: true },
                { name: 'Voice Channels', value: `${activeVoiceChannels}`, inline: true },
                { name: 'Uptime', value: formattedUptime, inline: true },
            );
        const primaryActions = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('admin_server_list').setLabel('Server List').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('admin_voice_channels').setLabel('Voice Channels').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('admin_send_message').setLabel('Send Message').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('admin_bot_stats').setLabel('Bot Statistics').setStyle(ButtonStyle.Secondary),
        );
        const secondaryActions = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('admin_response_modal').setLabel('Reply to Complaint').setStyle(ButtonStyle.Secondary),
        );
        await interaction.reply({
            embeds: [dashboardEmbed],
            components: [primaryActions, secondaryActions],
            flags: 64,
        });
    },
};
