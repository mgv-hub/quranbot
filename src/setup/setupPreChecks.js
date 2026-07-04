const { safeReply, safeError } = require('@interactions/flow/responder');
const bootstrap = require('@bot/bootstrap');
const { isSpecialUser } = require('@auth/auth-manager');
const { gif } = require('@helpers/emojis');

async function validateSetupPreConditions(interaction) {
    const guildId = interaction.guildId;
    const guildState = bootstrap.getGuildState(guildId);
    const isSpecial = isSpecialUser(interaction.user.id);

    const memberPerms = interaction.member.permissions;
    const hasManageChannels = memberPerms.has(bootstrap.PermissionsBitField.Flags.ManageChannels);
    const hasManageRoles = memberPerms.has(bootstrap.PermissionsBitField.Flags.ManageRoles);

    if (!isSpecial && (!hasManageChannels || !hasManageRoles)) {
        await safeError(interaction, 'يجب أن تمتلك صلاحيات إدارة القنوات وإدارة الرتب لاستخدام هذا الأمر', 'setup_auth_check');
        return { valid: false };
    }

    const botMember = interaction.guild.members.me;
    if (!botMember) {
        await safeError(interaction, 'حدث خطأ في بيانات البوت يرجى إعادة المحاولة', 'setup_member_check');
        return { valid: false };
    }

    const requiredPermissions = [
        { flag: bootstrap.PermissionsBitField.Flags.AddReactions, name: 'Add Reactions' },
        { flag: bootstrap.PermissionsBitField.Flags.ViewChannel, name: 'View Channel' },
        { flag: bootstrap.PermissionsBitField.Flags.SendMessages, name: 'Send Messages and Create Posts' },
        { flag: bootstrap.PermissionsBitField.Flags.EmbedLinks, name: 'Embed Links' },
        { flag: bootstrap.PermissionsBitField.Flags.AttachFiles, name: 'Attach Files' },
        { flag: bootstrap.PermissionsBitField.Flags.ReadMessageHistory, name: 'Read Message History' },
        { flag: bootstrap.PermissionsBitField.Flags.Connect, name: 'Connect' },
        { flag: bootstrap.PermissionsBitField.Flags.Speak, name: 'Speak' },
        { flag: bootstrap.PermissionsBitField.Flags.UseExternalEmojis, name: 'Use External Emojis' },
        { flag: bootstrap.PermissionsBitField.Flags.ManageRoles, name: 'Manage Roles' },
        { flag: bootstrap.PermissionsBitField.Flags.ManageChannels, name: 'Manage Channels' },
    ];

    const missingPermissions = requiredPermissions.filter((p) => !botMember.permissions.has(p.flag));

    if (missingPermissions.length > 0) {
        const missingNames = missingPermissions.map((p) => `\`${p.name}\``).join(', ');
        await safeError(interaction, `صلاحيات البوت غير كافية. يرجى منح البوت الصلاحيات التالية: ${missingNames}`, 'setup_perms_check');
        return { valid: false };
    }

    const isReSetup = !!global.setupGuilds[guildId];
    let channelWillBeDeleted = false;
    let oldSetup = null;

    if (isReSetup) {
        oldSetup = global.setupGuilds[guildId];
        const oldChannels = [oldSetup.voiceChannelId, oldSetup.textChannelId, oldSetup.azkarChannelId];
        channelWillBeDeleted = oldChannels.includes(interaction.channelId);
        if (channelWillBeDeleted && interaction.channel.type !== bootstrap.ChannelType.GuildText) {
            await safeError(interaction, 'لا يمكن تشغيل إعداد في قناة صوتية استخدمها في قناة نصية أولاً', 'setup_channel_type');
            return { valid: false };
        }
    }

    return {
        valid: true,
        isReSetup,
        channelWillBeDeleted,
        oldSetup,
    };
}

async function warnDoomedChannel(interaction, channelWillBeDeleted) {
    if (channelWillBeDeleted) {
        await safeReply(
            interaction,
            {
                content: `إعادة إعداد مكتشفة هذه القناة ستحذف قريباً الإعداد مستمر تحقق من الفئة الجديدة quran للوحة التحكم والتأكيد النهائي ${gif.loading}`,
            },
            'setup_re_setup_warn',
        );
        logger.info(`Guild ${interaction.guildId} Re-setup from doomed channel ${interaction.channelId} warned user`);
    } else {
        await safeReply(interaction, { content: `جاري إعداد فئة القرآن ${gif.loading}` }, 'setup_starting');
    }
}

module.exports.validateSetupPreConditions = validateSetupPreConditions;
module.exports.warnDoomedChannel = warnDoomedChannel;
