const persistentStateManager = require('@state/PersistentStateManager');
const { hasAdminPermission, hasAdminRole, isSpecialUser } = require('@auth/auth-manager');
const logger = require('@logging/logger');
const { emoji } = require('@helpers/emojis');
const { azkarSettings } = require('@config/constants');

function isAdmin(member) {
    return hasAdminPermission(member) || hasAdminRole(member) || isSpecialUser(member.id);
}

async function createAzkarRole(guild) {
    try {
        const existingRoleId = persistentStateManager.getGuildState(guild.id)?.azkarMentionRoleId;

        if (existingRoleId) {
            const existingRole = await guild.roles.fetch(existingRoleId).catch(() => null);
            if (existingRole) {
                return { success: true, role: existingRole, created: false };
            }
        }

        const roleName = azkarSettings.role.name;
        const existingByName = guild.roles.cache.find((r) => r.name === roleName);

        if (existingByName) {
            persistentStateManager.updateGuildState(guild.id, {
                azkarMentionRoleId: existingByName.id,
                azkarMentionRoleAutoCreated: false,
            });

            await persistentStateManager.saveGuildState(guild.id);
            return { success: true, role: existingByName, created: false };
        }

        const newRole = await guild.roles.create({
            name: roleName,
            colors: azkarSettings.role.color,
            mentionable: azkarSettings.role.mentionable,
            reason: azkarSettings.role.reason,
        });

        persistentStateManager.updateGuildState(guild.id, { azkarMentionRoleId: newRole.id, azkarMentionRoleAutoCreated: true });

        await persistentStateManager.saveGuildState(guild.id);

        logger.info(`Created azkar role "${roleName}" (${newRole.id}) in guild ${guild.id}`);
        return { success: true, role: newRole, created: true };
    } catch (err) {
        logger.error(`Failed to create azkar role in guild ${guild.id}`, err);
        return { success: false, error: err.message };
    }
}

async function renderAzkarSettingsMenu(interaction) {
    const guildState = persistentStateManager.getGuildState(interaction.guildId);
    const isEnabled = guildState?.azkarMentionEnabled;

    const roleId = guildState?.azkarMentionRoleId;
    const isAutoCreated = guildState?.azkarMentionRoleAutoCreated;

    let statusText = '';
    let roleStatusText = '';

    if (!roleId) {
        statusText = `${emoji.close} منشن معطل (لم يتم إنشاء رتبة)`;
        roleStatusText = `لا توجد رتبة محفوظة`;
    } else {
        const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
        if (role) {
            roleStatusText = `<@&${roleId}> (${role.name})${isAutoCreated ? ' - تم إنشاؤها تلقائياً' : ''}`;
        } else {
            roleStatusText = `${emoji.exclamation} الرتبة محفوظة في النظام (ID: \`${roleId}\`) لكن تم حذفها من السيرفر\nيمكنك الضغط على **إنشاء رتبة الأذكار تلقائياً** لإعادة إنشائها.`;
        }

        if (isEnabled) {
            statusText = `${emoji.check} المنشن مفعل (سيتم منشن الرتبة عند إرسال الأذكار)`;
        } else {
            statusText = `${emoji.pause} الرتبة محددة ومحفوظة، لكن ميزة المنشن معطلة حالياً`;
        }
    }

    const toggleLabel = isEnabled ? 'إيقاف المنشن' : 'تفعيل المنشن';

    return [
        {
            type: 17,
            accent_color: 0xfefdfe,
            components: [
                { type: 10, content: `### ${emoji.settings} اعدادات منشن الاذكار` },
                { type: 14, divider: true, spacing: 1 },
                { type: 10, content: `**حالة المنشن:** ${statusText}\n**الرتبة المحددة:** ${roleStatusText}` },
                { type: 14, divider: false, spacing: 2 },
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            custom_id: 'azkar_toggle_mention',
                            label: toggleLabel,
                            style: 2,
                            disabled: !roleId,
                        },
                        {
                            type: 2,
                            custom_id: 'azkar_create_role',
                            label: 'إنشاء رتبة الأذكار تلقائياً',
                            style: 2,
                        },
                        {
                            type: 2,
                            custom_id: 'azkar_remove_role',
                            label: 'إزالة الرتبة وإيقاف المنشن',
                            style: 2,
                            disabled: !roleId,
                        },
                    ],
                },
            ],
        },
    ];
}

module.exports = {
    isAdmin,
    createAzkarRole,
    renderAzkarSettingsMenu,
};
