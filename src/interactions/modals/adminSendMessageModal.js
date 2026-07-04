const logger = require('@logging/logger');
const { isSpecialUser } = require('@auth/auth-manager');
const { createStandardEmbed } = require('@ui/embedFactory');

module.exports = {
    customId: 'admin_send_msg_modal',
    async execute(interaction) {
        if (!isSpecialUser(interaction.user.id)) {
            return interaction.reply({ content: 'هذه الميزة متاحة للمطور فقط', flags: 64 });
        }
        await interaction.deferReply({ flags: 64 });
        try {
            const targetId = interaction.fields.getTextInputValue('admin_msg_guild_id');
            const messageContent = interaction.fields.getTextInputValue('admin_msg_content');
            const botClient = global.client;
            let targetChannel = null;
            let targetGuild = null;
            const guild = botClient.guilds.cache.get(targetId);
            if (guild) {
                targetGuild = guild;
                targetChannel =
                    guild.channels.cache.find((c) => c.name.includes('تحكم') && c.isTextBased()) ||
                    guild.channels.cache.find((c) => c.isTextBased());
            } else {
                targetChannel = botClient.channels.cache.get(targetId) || (await botClient.channels.fetch(targetId).catch(() => null));
                if (targetChannel && targetChannel.guild) targetGuild = targetChannel.guild;
            }
            if (!targetChannel || !targetChannel.isTextBased?.()) {
                return interaction.editReply({
                    content: 'لم يتم العثور على قناة نصية صالحة',
                    flags: 64,
                });
            }
            const botPermissions = targetChannel.permissionsFor(targetGuild?.members.me);
            if (!botPermissions || !botPermissions.has('SendMessages')) {
                return interaction.editReply({
                    content: 'البوت لا يملك صلاحية إرسال الرسائل في هذه القناة',
                    flags: 64,
                });
            }
            // Replaced manual EmbedBuilder creation with factory
            const adminMessageEmbed = createStandardEmbed()
                .setTitle('رسالة من فريق الدعم')
                .setDescription(messageContent)
                .addFields(
                    { name: 'المرسل', value: `${interaction.user.tag}`, inline: true },
                    { name: 'صلاحية المرسل', value: `مطور البوت`, inline: true },
                    {
                        name: 'التوقيت',
                        value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                        inline: true,
                    },
                );
            await targetChannel.send({ embeds: [adminMessageEmbed] });
            logger.info(`Admin ${interaction.user.tag} sent message to guild ${targetGuild?.id || 'unknown'} channel ${targetChannel.id}`);
            return interaction.editReply({
                content: 'تم إرسال الرسالة بنجاح إلى قناة التحكم',
                flags: 64,
            });
        } catch (error) {
            logger.error('Error in admin send message modal', error);
            return interaction.editReply({ content: `حدث خطأ: ${error.message}`, flags: 64 });
        }
    },
};
