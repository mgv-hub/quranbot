const { PermissionsBitField } = require('discord.js');
const logger = require('@logging/logger');
const { isSpecialUser } = require('@auth/auth-manager');
const { createStandardEmbed } = require('@ui/embedFactory');

module.exports = {
    customId: 'admin_response_modal_submit',
    async execute(interaction) {
        try {
            if (!isSpecialUser(interaction.user.id)) {
                return interaction.reply({ content: 'هذا الامر متاح فقط للمطور', flags: 64 });
            }
            await interaction.deferReply({ flags: 64 });
            const targetId = interaction.fields.getTextInputValue('admin_guild_id') || '';
            const roleLevel = interaction.fields.getTextInputValue('admin_role_level');
            const messageContent = interaction.fields.getTextInputValue('admin_message');
            const targetUserId = interaction.fields.getTextInputValue('admin_target_user_id') || '';
            const cleanTargetId = targetId.trim();
            const cleanUserId = targetUserId.trim();
            if (!cleanTargetId && !cleanUserId) {
                return interaction.editReply({
                    content: 'يرجى كتابة معرف القناة أو معرف المستخدم على الأقل لا يمكن تركهما فارغين معا',
                    flags: 64,
                });
            }
            if (!roleLevel || roleLevel.trim() === '') {
                return interaction.editReply({
                    content: 'يرجى كتابة صلاحيك في فريق البوت',
                    flags: 64,
                });
            }
            if (!messageContent || messageContent.trim() === '') {
                return interaction.editReply({ content: 'يرجى كتابة الرسالة', flags: 64 });
            }
            let targetChannel = null;
            let targetGuild = null;
            let targetUser = null;
            let dmSent = false,
                dmFailed = false,
                dmFailedReason = '';
            let channelSent = false,
                channelFailed = false,
                channelFailedReason = '';
            if (cleanUserId) {
                try {
                    targetUser = await global.client.users.fetch(cleanUserId);
                } catch {
                    targetUser = null;
                }
            }
            if (targetUser) {
                try {
                    const dmEmbed = createStandardEmbed()
                        .setTitle('رد من فريق الدعم')
                        .setDescription(messageContent)
                        .addFields(
                            { name: 'المرسل', value: `${interaction.user.tag}`, inline: true },
                            {
                                name: 'صلاحية المرسل في فريق البوت',
                                value: `${roleLevel.trim()}`,
                                inline: true,
                            },
                            {
                                name: 'التوقيت',
                                value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                                inline: true,
                            },
                        );
                    await targetUser.send({ embeds: [dmEmbed] });
                    dmSent = true;
                } catch (dmErr) {
                    dmFailed = true;
                    dmFailedReason =
                        dmErr.code === 50007
                            ? 'المستخدم لديه الرسائل الخاصة مغلقة'
                            : dmErr.code === 50005
                              ? 'لا يمكن إرسال رسائل خاصة لهذا المستخدم'
                              : dmErr.message || 'خطأ غير معروف';
                }
            }
            if (cleanTargetId) {
                try {
                    const guild = global.client.guilds.cache.get(cleanTargetId);
                    if (guild) {
                        targetGuild = guild;
                        targetChannel =
                            guild.channels.cache.find((c) => c.name.includes('تحكم') && c.isTextBased()) ||
                            guild.channels.cache.find((c) => c.isTextBased());
                    } else {
                        targetChannel =
                            global.client.channels.cache.get(cleanTargetId) ||
                            (await global.client.channels.fetch(cleanTargetId).catch(() => null));
                        if (targetChannel && targetChannel.guild) targetGuild = targetChannel.guild;
                    }
                } catch {}
                if (targetChannel && targetChannel.isTextBased?.()) {
                    const botPerms = targetChannel.permissionsFor(targetGuild?.members.me);
                    if (!botPerms || !botPerms.has(PermissionsBitField.Flags.SendMessages)) {
                        channelFailed = true;
                        channelFailedReason = 'البوت لا يملك صلاحية ارسال الرسائل في هذه القناة';
                    } else {
                        try {
                            const adminEmbed = createStandardEmbed()
                                .setTitle('رسالة من فريق الدعم')
                                .setDescription(messageContent)
                                .addFields(
                                    { name: 'المرسل', value: `${interaction.user.tag}`, inline: true },
                                    {
                                        name: 'صلاحية المرسل في فريق البوت',
                                        value: `${roleLevel.trim()}`,
                                        inline: true,
                                    },
                                    {
                                        name: 'التوقيت',
                                        value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                                        inline: true,
                                    },
                                );
                            if (targetUser)
                                adminEmbed.addFields({
                                    name: 'حالة الإرسال على الخاص',
                                    value: dmSent ? 'تم الإرسال بنجاح' : `فشل الإرسال ${dmFailedReason}`,
                                    inline: false,
                                });
                            await targetChannel.send({ embeds: [adminEmbed] });
                            channelSent = true;
                        } catch (sendErr) {
                            channelFailed = true;
                            channelFailedReason = sendErr.message || 'خطأ أثناء الإرسال';
                        }
                    }
                } else if (cleanTargetId) {
                    channelFailed = true;
                    channelFailedReason = 'لم يتم العثور على قناة نصية صالحة تأكد من المعرف';
                }
            }
            let replyContent = '';
            if (channelSent) replyContent += 'تم ارسال الرسالة بنجاح الى قناة التحكم';
            else if (channelFailed) replyContent += `فشل الإرسال للقناة ${channelFailedReason}`;
            if (targetUser) {
                if (replyContent) replyContent += '\n';
                if (dmSent) replyContent += 'تم إرسال الرد على الخاص للمستخدم بنجاح';
                else if (dmFailed) replyContent += `فشل إرسال الرد على الخاص ${dmFailedReason}`;
            }
            if (!channelSent && !channelFailed && !targetUser) replyContent = 'لم يتم تحديد قناة أو مستخدم صالح للإرسال';
            return interaction.editReply({ content: replyContent, flags: 64 });
        } catch (error) {
            logger.error('Error in admin response modal', error);
            try {
                if (interaction.deferred || interaction.replied)
                    await interaction.editReply({ content: `حدث خطأ ${error.message}`, flags: 64 });
                else await interaction.reply({ content: `حدث خطأ ${error.message}`, flags: 64 });
            } catch (replyErr) {
                logger.error('Failed to send error reply', replyErr);
            }
        }
    },
};
