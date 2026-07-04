const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isSpecialUser } = require('@auth/auth-manager');
const { createStandardEmbed } = require('@ui/embedFactory');

module.exports = {
    customId: 'submit_complaint',
    async execute(interaction) {
        const isDeveloper = isSpecialUser(interaction.user.id);
        if (isDeveloper) {
            const primaryAdminActions = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('admin_server_list').setLabel('Server List').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('admin_send_message').setLabel('Send Message').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('admin_bot_stats').setLabel('Bot Statistics').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('admin_response_modal').setLabel('Reply to Complaint').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('admin_voice_channels').setLabel('Voice Channels').setStyle(ButtonStyle.Secondary),
            );
            // Used factory instead of manual builder
            const adminDashboard = createStandardEmbed()
                .setTitle('Developer Control Panel')
                .setDescription('**Welcome to the Developer Control Panel**\nThis panel is available only to you and allows you to:')
                .addFields(
                    {
                        name: 'Server List',
                        value: 'View all servers where the bot is present',
                        inline: true,
                    },
                    {
                        name: 'Send Message',
                        value: 'Send an administrative message to any server',
                        inline: true,
                    },
                    { name: 'Bot Statistics', value: 'View detailed bot statistics', inline: true },
                    {
                        name: 'Reply to Complaint',
                        value: 'Respond to submitted complaints',
                        inline: true,
                    },
                    {
                        name: 'Voice Channels',
                        value: 'View all voice channels where bot is connected',
                        inline: true,
                    },
                    { name: 'Leave Server', value: 'Remove the bot from any server', inline: true },
                    { name: 'Protection System', value: 'Active and Protected', inline: true },
                );
            await interaction.reply({
                embeds: [adminDashboard],
                components: [primaryAdminActions],
                flags: 64,
            });
        } else {
            const supportMenu = createStandardEmbed()
                .setTitle('مركز الدعم والمساعدة')
                .setDescription('**نقدر اهتمامك بالبوت ونسعد بمساعدتك**\nيمكنك التواصل معنا عبر إحدى الطرق التالية:')
                .addFields(
                    {
                        name: 'تقديم شكوى أو اقتراح',
                        value: 'أرسل لنا شكواك أو اقتراحك مباشرة وسيتم مراجعتها من قبل فريق الدعم',
                        inline: false,
                    },
                    {
                        name: 'سيرفر الدعم المباشر',
                        value: 'انضم لسيرفر الدعم للتواصل المباشر والحصول على مساعدة أسرع',
                        inline: false,
                    },
                );
            const supportActions = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('open_complaint_modal').setLabel('تقديم شكوى/اقتراح').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setLabel('سيرفر الدعم').setStyle(ButtonStyle.Link).setURL('https://discord.gg/DwtAPzrbZS'),
            );
            await interaction.reply({
                embeds: [supportMenu],
                components: [supportActions],
                flags: 64,
            });
        }
    },
};
