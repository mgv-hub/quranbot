const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const formatTimeDuration = require('@helpers/time/formatUptime');
const logger = require('@logging/logger');
const os = require('os');

module.exports = {
    customId: 'admin_bot_stats',

    async execute(interaction) {
        // Restrict access to authorized developer accounts only
        const requesterId = interaction.user.id;
        const isAuthorized = global.SPE_USER_IDS.includes(requesterId);

        if (!isAuthorized) {
            return interaction.reply({
                content: 'This feature is available for the developers only',
                flags: 64,
            });
        }

        // Acknowledge the interaction to prevent timeout
        await interaction.deferUpdate();

        const botClient = global.client;
        const cachedGuilds = botClient.guilds.cache;
        const aggregateMembers = cachedGuilds.reduce((total, guild) => total + guild.memberCount, 0);

        // Gather runtime diagnostics
        const memoryStats = process.memoryUsage();
        const rssMegabytes = (memoryStats.rss / 1024 / 1024).toFixed(2);
        const currentPlatform = os.platform();
        const runtimeVersion = process.version;

        const statsEmbed = new EmbedBuilder()
            .setColor(0xfefdfe)
            .setTitle('Detailed Bot Statistics')
            .setDescription('**Bot and Server Information**')
            .addFields(
                { name: 'Server Count', value: `${cachedGuilds.size}`, inline: true },
                { name: 'Total Members', value: `${aggregateMembers}`, inline: true },
                {
                    name: 'User',
                    value: `${aggregateMembers - cachedGuilds.reduce((acc, g) => acc + g.members.cache.filter((m) => m.user.bot).size, 0)}`,
                    inline: true,
                },
                { name: 'Platform', value: `${currentPlatform}`, inline: true },
                { name: 'Node.js', value: `${runtimeVersion}`, inline: true },
                {
                    name: 'Uptime',
                    value: formatTimeDuration(botClient.uptime, 'en'),
                    inline: true,
                },
                {
                    name: 'Start Date',
                    value: `<t:${Math.floor((Date.now() - botClient.uptime) / 1000)}:R>`,
                    inline: true,
                },
                { name: 'Protection System', value: 'Active', inline: true },
            );

        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('admin_back_to_panel').setLabel('Back to Panel').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('admin_refresh_stats').setLabel('Refresh').setStyle(ButtonStyle.Secondary),
        );

        await interaction.followUp({
            embeds: [statsEmbed],
            components: [actionRow],
            flags: 64,
        });
    },
};
