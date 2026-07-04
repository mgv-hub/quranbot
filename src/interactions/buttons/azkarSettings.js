const persistentStateManager = require('@state/PersistentStateManager');
const { safeError, safeReply } = require('@interactions/flow/responder');
const { isAdmin, createAzkarRole, renderAzkarSettingsMenu } = require('@interactions/helpers/azkarSettingsHelper');

module.exports = {
    customId: 'azkar_settings',
    async execute(interaction) {
        const actionId = interaction.customId;

        if (actionId === 'azkar_settings') {
            if (!isAdmin(interaction.member)) {
                return safeError(interaction, 'تتطلب هذه العملية امتلاك صلاحيات المسؤول (Administrator)');
            }
            const components = await renderAzkarSettingsMenu(interaction);

            return safeReply(interaction, { components, flags: 32832 }, 'azkar_settings_menu');
        }

        if (actionId === 'azkar_create_role') {
            if (!isAdmin(interaction.member)) return safeError(interaction, 'صلاحيات غير كافية');
            const botMember = interaction.guild.members.me;

            if (!botMember.permissions.has('ManageRoles')) {
                return safeError(interaction, 'البوت يحتاج صلاحية إدارة الرتب لإنشاء الرتبة تلقائياً');
            }

            const result = await createAzkarRole(interaction.guild);

            if (result.success) {
                const components = await renderAzkarSettingsMenu(interaction);
                return interaction.update({ components, flags: 32832 });
            } else {
                return safeError(interaction, `فشل إنشاء الرتبة: ${result.error}`);
            }
        }

        if (actionId === 'azkar_toggle_mention') {
            if (!isAdmin(interaction.member)) return safeError(interaction, 'صلاحيات غير كافية');

            const guildState = persistentStateManager.getGuildState(interaction.guildId);

            if (!guildState?.azkarMentionRoleId) {
                return safeError(interaction, 'يجب إنشاء رتبة الأذكار أولاً قبل تفعيل المنشن');
            }
            const newState = !guildState.azkarMentionEnabled;

            persistentStateManager.updateGuildState(interaction.guildId, { azkarMentionEnabled: newState });
            await persistentStateManager.saveGuildState(interaction.guildId);

            const components = await renderAzkarSettingsMenu(interaction);
            return interaction.update({ components, flags: 32832 });
        }

        if (actionId === 'azkar_remove_role') {
            if (!isAdmin(interaction.member)) return safeError(interaction, 'صلاحيات غير كافية');
            const guildState = persistentStateManager.getGuildState(interaction.guildId);

            if (!guildState?.azkarMentionRoleId) {
                return safeError(interaction, 'لا توجد رتبة محددة حالياً');
            }

            persistentStateManager.updateGuildState(interaction.guildId, {
                azkarMentionRoleId: null,
                azkarMentionEnabled: false,
                azkarMentionRoleAutoCreated: false,
            });

            await persistentStateManager.saveGuildState(interaction.guildId);

            const components = await renderAzkarSettingsMenu(interaction);
            return interaction.update({ components, flags: 32832 });
        }

        if (actionId === 'azkar_get_role') {
            const guildState = persistentStateManager.getGuildState(interaction.guildId);

            if (!guildState?.azkarMentionRoleId) {
                return safeError(interaction, 'لم يتم تعيين رتبة للمنشن بعد من قبل الإدارة');
            }

            const role = await interaction.guild.roles.fetch(guildState.azkarMentionRoleId).catch(() => null);
            if (!role) {
                return safeError(interaction, 'الرتبة المحددة غير موجودة أو تم حذفها من السيرفر');
            }

            const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
            if (!member) return safeError(interaction, 'حدث خطأ في جلب بياناتك');

            const hasRole = member.roles.cache.has(role.id);

            if (hasRole) {
                await member.roles.remove(role).catch(() => {});
                return safeReply(interaction, { content: `تم إزالة رتبة المنشن <@&${role.id}> من حسابك`, flags: 64 }, 'azkar_role_remove');
            } else {
                await member.roles.add(role).catch(() => {});
                return safeReply(
                    interaction,
                    { content: `تم إضافة رتبة المنشن <@&${role.id}> إلى حسابك بنجاح`, flags: 64 },
                    'azkar_role_add',
                );
            }
        }
    },
};
