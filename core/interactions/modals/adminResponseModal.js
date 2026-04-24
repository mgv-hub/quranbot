require('pathlra-aliaser')();
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const logger = require('@logger');
module.exports = {
   customId: 'admin_response_modal_submit',
   async execute(interaction) {
      try {
         const userId = interaction.user.id;
         const isSpecialUser = global.SPE_USER_IDS.includes(userId);
         if (!isSpecialUser) {
            return interaction.reply({
               content: 'هذا الامر متاح فقط للمطور',
               flags: 64,
            });
         }
         await interaction.deferReply({ flags: 64 });
         const guildIdOrChannelId =
            interaction.fields.getTextInputValue('admin_guild_id') || '';
         const roleLevel = interaction.fields.getTextInputValue('admin_role_level');
         const messageContent = interaction.fields.getTextInputValue('admin_message');
         const targetUserId =
            interaction.fields.getTextInputValue('admin_target_user_id') || '';
         const cleanGuildId = guildIdOrChannelId.trim();
         const cleanUserId = targetUserId.trim();
         if (!cleanGuildId && !cleanUserId) {
            return interaction.editReply({
               content:
                  'يرجى كتابة معرف القناة أو معرف المستخدم على الأقل لا يمكن تركهما فارغين معا',
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
            return interaction.editReply({
               content: 'يرجى كتابة الرسالة',
               flags: 64,
            });
         }
         let targetChannel = null;
         let targetGuild = null;
         let targetUser = null;
         let dmSent = false;
         let dmFailed = false;
         let dmFailedReason = '';
         let channelSent = false;
         let channelFailed = false;
         let channelFailedReason = '';
         if (cleanUserId) {
            try {
               targetUser = await global.client.users.fetch(cleanUserId);
            } catch (fetchError) {
               logger.warn('Failed To Fetch Target User ' + cleanUserId);
               targetUser = null;
            }
         }
         if (targetUser) {
            try {
               const dmEmbed = new EmbedBuilder()
                  .setColor(0x1e1f22)
                  .setTitle('رد من فريق الدعم')
                  .setDescription(messageContent)
                  .addFields(
                     {
                        name: 'المرسل',
                        value: `${interaction.user.tag}`,
                        inline: true,
                     },
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
               logger.info(
                  `DM Sent Successfully To User ${targetUser.tag} (${targetUser.id})`,
               );
            } catch (dmError) {
               dmFailed = true;
               if (dmError.code === 50007) {
                  dmFailedReason = 'المستخدم لديه الرسائل الخاصة مغلقة';
               } else if (dmError.code === 50005) {
                  dmFailedReason = 'لا يمكن إرسال رسائل خاصة لهذا المستخدم';
               } else {
                  dmFailedReason = dmError.message || 'خطأ غير معروف';
               }
               logger.warn(
                  `Failed To Send DM To User ${cleanUserId} Reason ${dmFailedReason}`,
               );
            }
         }
         if (cleanGuildId) {
            try {
               const guild = global.client.guilds.cache.get(cleanGuildId);
               if (guild) {
                  targetGuild = guild;
                  const textChannel = guild.channels.cache.find(
                     (c) => c.name.includes('تحكم') && c.isTextBased(),
                  );
                  if (textChannel) {
                     targetChannel = textChannel;
                  } else {
                     targetChannel = guild.channels.cache.find((c) => c.isTextBased());
                  }
               } else {
                  targetChannel =
                     global.client.channels.cache.get(cleanGuildId) ||
                     (await global.client.channels.fetch(cleanGuildId).catch(() => null));
                  if (targetChannel && targetChannel.guild) {
                     targetGuild = targetChannel.guild;
                  }
               }
            } catch (fetchError) {
               logger.error('Error fetching channel/guild', fetchError);
            }
            if (targetChannel && targetChannel.isTextBased?.()) {
               const botPermissions = targetChannel.permissionsFor(targetGuild?.members.me);
               if (
                  !botPermissions ||
                  !botPermissions.has(PermissionsBitField.Flags.SendMessages)
               ) {
                  channelFailed = true;
                  channelFailedReason = 'البوت لا يملك صلاحية ارسال الرسائل في هذه القناة';
               } else {
                  try {
                     const cleanRoleLevel = roleLevel.trim();
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
                              name: 'صلاحية المرسل في فريق البوت',
                              value: `${cleanRoleLevel}`,
                              inline: true,
                           },
                           {
                              name: 'التوقيت',
                              value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                              inline: true,
                           },
                        );
                     if (targetUser) {
                        adminEmbed.addFields({
                           name: 'حالة الإرسال على الخاص',
                           value: dmSent
                              ? 'تم الإرسال بنجاح'
                              : `فشل الإرسال ${dmFailedReason}`,
                           inline: false,
                        });
                     }
                     await targetChannel.send({ embeds: [adminEmbed] });
                     channelSent = true;
                     logger.info(
                        `Admin ${interaction.user.tag} (${cleanRoleLevel}) sent message to guild ${targetGuild?.id || 'unknown'} channel ${targetChannel.id}`,
                     );
                  } catch (sendError) {
                     channelFailed = true;
                     channelFailedReason = sendError.message || 'خطأ أثناء الإرسال';
                     logger.error('Error sending message to channel', sendError);
                  }
               }
            } else {
               if (cleanGuildId) {
                  channelFailed = true;
                  channelFailedReason = 'لم يتم العثور على قناة نصية صالحة تأكد من المعرف';
               }
            }
         }
         let replyContent = '';
         if (channelSent) {
            replyContent += 'تم ارسال الرسالة بنجاح الى قناة التحكم';
         } else if (channelFailed) {
            replyContent += `فشل الإرسال للقناة ${channelFailedReason}`;
         }
         if (targetUser) {
            if (replyContent) replyContent += '\n';
            if (dmSent) {
               replyContent += 'تم إرسال الرد على الخاص للمستخدم بنجاح';
            } else if (dmFailed) {
               replyContent += `فشل إرسال الرد على الخاص ${dmFailedReason}`;
            }
         }
         if (!channelSent && !channelFailed && !targetUser) {
            replyContent = 'لم يتم تحديد قناة أو مستخدم صالح للإرسال';
         }
         return interaction.editReply({
            content: replyContent,
            flags: 64,
         });
      } catch (error) {
         logger.error('Error in admin response modal', error);
         try {
            if (interaction.deferred || interaction.replied) {
               await interaction.editReply({
                  content: `حدث خطأ ${error.message}`,
                  flags: 64,
               });
            } else {
               await interaction.reply({
                  content: `حدث خطأ ${error.message}`,
                  flags: 64,
               });
            }
         } catch (replyError) {
            logger.error('Failed to send error reply', replyError);
         }
      }
   },
};
