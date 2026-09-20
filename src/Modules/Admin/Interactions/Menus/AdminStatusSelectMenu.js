const statusManager = require('@state/StatusManager');
const { isSpecialUser } = require('@core/Auth/AuthManager');

module.exports = {
    customId: 'admin_status_select',
    async execute(interaction) {
        if (!isSpecialUser(interaction.user.id)) {
            return interaction.reply({ content: 'This feature is available for the developers only', flags: 64 });
        }

        await interaction.deferUpdate();
        const selectedValue = interaction.values[0];
        const customId = interaction.customId;

        if (customId === 'admin_status_presence_select') {
            await statusManager.updateStatus({ presence: selectedValue });
            await interaction.followUp({ content: `Presence updated to **${selectedValue}**`, flags: 64 });
        } else if (customId === 'admin_status_activity_select') {
            await statusManager.updateStatus({ activityType: selectedValue });
            await interaction.followUp({ content: `Activity type updated to **${selectedValue}**`, flags: 64 });
        }
    }
};
