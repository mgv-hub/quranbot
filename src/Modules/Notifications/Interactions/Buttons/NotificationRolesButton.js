module.exports = {
    customId: 'notification_roles',
    async execute(interaction) {
        if (!interaction.guildId) {
            return interaction.reply({ content: 'Server-only interaction', flags: 64 });
        }

        const roleId =
            process.env[
                interaction.customId === 'notify_all'
                    ? 'NOTIFY_ALL_ROLE_ID'
                    : interaction.customId === 'notify_major'
                      ? 'NOTIFY_MAJOR_ROLE_ID'
                      : 'NOTIFY_MINOR_ROLE_ID'
            ];

        if (!roleId) {
            return interaction.reply({ content: 'Role not configured in environment.', flags: 64 });
        }

        await interaction.deferReply({ flags: 64 });

        const targetRole = await interaction.guild.roles.fetch(roleId).catch(() => null);
        if (!targetRole) {
            return interaction.editReply({ content: 'Role not found.' });
        }

        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (!member) {
            return interaction.editReply({ content: 'Member not found.' });
        }

        const asRole = member.roles.cache.has(roleId);

        const rolename =
            interaction.customId === 'notify_all'
                ? 'All Updates'
                : interaction.customId === 'notify_major'
                  ? 'Major Updates'
                  : 'Minor Updates';

        if (asRole) {
            await member.roles.remove(targetRole);
            return interaction.editReply({ content: `Removed <@&${roleId}> (${rolename}).` });
        }

        await member.roles.add(targetRole);
        return interaction.editReply({ content: `Added <@&${roleId}> (${rolename}).` });
    },
};
