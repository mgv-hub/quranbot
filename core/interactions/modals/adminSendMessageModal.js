require('pathlra-aliaser')();
const { EmbedBuilder } = require('discord.js');
const logger = require('@logger');

module.exports = {
   customId: 'admin_send_msg_modal',
   async execute(interaction) {
      const userId = interaction.user.id;
      const isSpecialUser = global.SPE_USER_IDS.includes(userId);

      if (!isSpecialUser) {
         return interaction.reply({
            content: 'هذه الميزة متاحة للمطور فقط',
            flags: 64,
         });
      }

      await interaction.deferReply({ flags: 64 });

      try {
         const guildIdOrChannelId = interaction.fields.getTextInputValue('admin_msg_guild_id');
         const messageContent = interaction.fields.getTextInputValue('admin_msg_content');

         const client = global.client;
         let targetChannel = null;
         let targetGuild = null;

         const guild = client.guilds.cache.get(guildIdOrChannelId);
         if (guild) {
            targetGuild = guild;
            const textChannel = guild.channels.cache.find((c) => c.name.includes('تحكم') && c.isTextBased());
            if (textChannel) {
               targetChannel = textChannel;
            } else {
               targetChannel = guild.channels.cache.find((c) => c.isTextBased());
            }
         } else {
            targetChannel =
               client.channels.cache.get(guildIdOrChannelId) ||
               (await client.channels.fetch(guildIdOrChannelId).catch(() => null));
            if (targetChannel && targetChannel.guild) {
               targetGuild = targetChannel.guild;
            }
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

         const adminEmbed = new EmbedBuilder()
            .setColor(0x1e1f22)
            .setTitle('رسالة من فريق الدعم')
            .setDescription(messageContent)
            .addFields(
               {
                  name: 'المرسل',
                  value: `${interaction.user.tag}`,
                  inline: true,
               },
               {
                  name: 'صلاحية المرسل',
                  value: `مطور البوت`,
                  inline: true,
               },
               {
                  name: 'التوقيت',
                  value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                  inline: true,
               },
            );
         await targetChannel.send({ embeds: [adminEmbed] });

         logger.info(
            `Admin ${interaction.user.tag} sent message to guild ${targetGuild?.id || 'unknown'} channel ${targetChannel.id}`,
         );

         return interaction.editReply({
            content: 'تم إرسال الرسالة بنجاح إلى قناة التحكم',
            flags: 64,
         });
      } catch (error) {
         logger.error('Error in admin send message modal', error);
         return interaction.editReply({
            content: `حدث خطأ: ${error.message}`,
            flags: 64,
         });
      }
   },
};
