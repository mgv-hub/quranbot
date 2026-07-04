const persistentStateManager = require('@state/PersistentStateManager');
const { hasAdminPermission, hasAdminRole, isSpecialUser } = require('@auth/auth-manager');
const { safeError, safeReply } = require('@interactions/flow/responder');

function isAdmin(member) {
    return hasAdminPermission(member) || hasAdminRole(member) || isSpecialUser(member.id);
}

module.exports = {
    customId: 'azkar_set_role_modal_submit',
    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return safeError(interaction, 'صلاحيات غير كافية');
        }

        const roleId = interaction.fields.getTextInputValue('azkar_role_id').trim();
        if (!/^\d{17,20}$/.test(roleId)) {
            return safeError(interaction, 'معرف الرتبة غير صالح. يرجى إدخال معرف رقمي صحيح');
        }

        const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
        if (!role) {
            return safeError(interaction, 'الرتبة المحددة غير موجودة في هذا السيرفر');
        }

        persistentStateManager.updateGuildState(interaction.guildId, { azkarMentionRoleId: roleId, azkarMentionRoleAutoCreated: false });
        await persistentStateManager.saveGuildState(interaction.guildId);
        return safeReply(interaction, { content: `تم تعيين رتبة المنشن بنجاح: <@&${roleId}>`, flags: 64 }, 'azkar_set_role');
    },
};
