const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isSpecialUser } = require('@core/Auth/AuthManager');
const statusManager = require('@state/StatusManager');

module.exports = {
    customId: 'admin_status_manager',
    async execute(interaction) {
        if (!isSpecialUser(interaction.user.id)) {
            return interaction.reply({ content: 'This feature is available for the developers only', flags: 64 });
        }

        const customId = interaction.customId;

        if (customId === 'admin_status_clear') {
            await interaction.deferUpdate();
            await statusManager.clearStatus();
            await interaction.followUp({ content: 'All manual status cleared. Bot will return to default status gradually.', flags: 64 });
            return;
        }

        if (customId === 'admin_status_text_modal') {
            const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
            const modal = new ModalBuilder().setCustomId('admin_status_text_submit').setTitle('Set Status Text');
            const textField = new TextInputBuilder()
                .setCustomId('status_text')
                .setLabel('Enter the status text')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(128)
                .setPlaceholder('e.g., Under maintenance...');
            const row = new ActionRowBuilder().addComponents(textField);
            modal.addComponents(row);
            await interaction.showModal(modal);
            return;
        }

        if (customId === 'admin_voice_status_modal') {
            const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
            const modal = new ModalBuilder().setCustomId('admin_voice_status_submit').setTitle('Set Voice Status');
            const textField = new TextInputBuilder()
                .setCustomId('voice_status_text')
                .setLabel('Enter the voice status text')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(500)
                .setPlaceholder('e.g., Voice systems are currently unstable...');
            const row = new ActionRowBuilder().addComponents(textField);
            modal.addComponents(row);
            await interaction.showModal(modal);
            return;
        }

        const currentStatus = statusManager.getStatus();

        const presenceOptions = [
            new StringSelectMenuOptionBuilder()
                .setLabel('Online')
                .setValue('online')
                .setDefault(currentStatus.presence === 'online'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Idle')
                .setValue('idle')
                .setDefault(currentStatus.presence === 'idle'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Do Not Disturb')
                .setValue('dnd')
                .setDefault(currentStatus.presence === 'dnd'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Invisible')
                .setValue('invisible')
                .setDefault(currentStatus.presence === 'invisible'),
        ];

        const presenceMenu = new StringSelectMenuBuilder()
            .setCustomId('admin_status_presence_select')
            .setPlaceholder('Change Bot Presence')
            .addOptions(presenceOptions);

        const activityOptions = [
            new StringSelectMenuOptionBuilder()
                .setLabel('Playing')
                .setValue('Playing')
                .setDefault(currentStatus.activityType === 'Playing'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Watching')
                .setValue('Watching')
                .setDefault(currentStatus.activityType === 'Watching'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Listening')
                .setValue('Listening')
                .setDefault(currentStatus.activityType === 'Listening'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Competing')
                .setValue('Competing')
                .setDefault(currentStatus.activityType === 'Competing'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Custom Status')
                .setValue('Custom')
                .setDefault(currentStatus.activityType === 'Custom'),
        ];

        const activityMenu = new StringSelectMenuBuilder()
            .setCustomId('admin_status_activity_select')
            .setPlaceholder('Change Activity Type')
            .addOptions(activityOptions);

        const presenceRow = new ActionRowBuilder().addComponents(presenceMenu);
        const activityRow = new ActionRowBuilder().addComponents(activityMenu);

        const components = [
            {
                type: 17,
                accent_color: 0xfefdfe,
                components: [
                    { type: 10, content: '### Bot Status Manager' },
                    { type: 14, divider: true, spacing: 1 },
                    { type: 10, content: "Use the menus below to change the bot's presence and activity status." },
                    { type: 14, divider: false, spacing: 2 },
                    presenceRow.toJSON(),
                    activityRow.toJSON(),
                    {
                        type: 1,
                        components: [
                            new ButtonBuilder()
                                .setCustomId('admin_status_text_modal')
                                .setLabel('Set Status Text')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('admin_voice_status_modal')
                                .setLabel('Set Voice Status')
                                .setStyle(ButtonStyle.Secondary),
                        ],
                    },
                    {
                        type: 1,
                        components: [
                            new ButtonBuilder()
                                .setCustomId('admin_status_clear')
                                .setLabel('Clear All Manual Status')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('admin_back_to_panel')
                                .setLabel('Back to Panel')
                                .setStyle(ButtonStyle.Secondary),
                        ],
                    },
                ],
            },
        ];

        await interaction.reply({ components, flags: 32832 });
    },
};
