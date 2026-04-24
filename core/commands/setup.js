require('pathlra-aliaser')();
const { setupQuranCategory } = require('@setupCommands-core_commands');
module.exports = {
   name: 'إعداد',
   description: 'قم بإعداد قسم القرآن الكريم مع قنوات خاصة بالمسؤولين فقط',
   async execute(interaction) {
      const imp = require('@loader-core_bootstrap');
      const guildId = interaction.guildId;
      if (!interaction.guild) {
         try {
            if (!interaction.deferred && !interaction.replied) {
               await interaction.deferReply({ flags: 64 }).catch(() => {});
            }
            await interaction
               .editReply({
                  content: 'هذا الأمر يمكن استخدامه فقط داخل السيرفرات وليس في الرسائل الخاصة',
                  flags: 64,
               })
               .catch(() => {});
         } catch (e) {
            imp.logger.warn('Setup reply failed');
         }
         return;
      }
      const state = imp.getGuildState(guildId);
      if (!imp.isAuthorized(interaction, state, null)) {
         try {
            if (!interaction.deferred && !interaction.replied) {
               await interaction.deferReply({ flags: 64 }).catch(() => {});
            }
            await interaction
               .editReply({
                  content: 'يجب أن تمتلك صلاحية ادمنستريتر',
                  flags: 64,
               })
               .catch(() => {});
         } catch (e) {
            imp.logger.warn('Setup auth failed');
         }
         return;
      }
      const me = interaction.guild.members.me;
      if (!me) {
         try {
            if (!interaction.deferred && !interaction.replied) {
               await interaction.deferReply({ flags: 64 }).catch(() => {});
            }
            await interaction
               .editReply({
                  content: 'حدث خطأ في بيانات البوت يرجى إعادة المحاولة',
                  flags: 64,
               })
               .catch(() => {});
         } catch (e) {
            imp.logger.warn('Setup member check failed');
         }
         return;
      }
      const requiredPermissions = [
         imp.PermissionsBitField.Flags.ManageChannels,
         imp.PermissionsBitField.Flags.ManageRoles,
         imp.PermissionsBitField.Flags.ViewChannel,
         imp.PermissionsBitField.Flags.Connect,
         imp.PermissionsBitField.Flags.Speak,
      ];
      const missingPermissions = requiredPermissions.filter(
         (perm) => !me.permissions.has(perm),
      );
      if (missingPermissions.length > 0) {
         try {
            if (!interaction.deferred && !interaction.replied) {
               await interaction.deferReply({ flags: 64 }).catch(() => {});
            }
            await interaction
               .editReply({
                  content:
                     'صلاحيات البوت غير كافية لإعداد القنوات ادمن ستريتر مؤقتاً أثناء الإعداد',
                  flags: 64,
               })
               .catch(() => {});
         } catch (e) {
            imp.logger.warn('Setup permission check failed');
         }
         return;
      }
      const isReSetup = !!global.setupGuilds[guildId];
      let channelWillBeDeleted = false;
      let oldSetup = null;
      if (isReSetup) {
         oldSetup = global.setupGuilds[guildId];
         const oldChannels = [
            oldSetup.voiceChannelId,
            oldSetup.textChannelId,
            oldSetup.azkarChannelId,
         ];
         channelWillBeDeleted = oldChannels.includes(interaction.channelId);
         if (channelWillBeDeleted && interaction.channel.type !== imp.ChannelType.GuildText) {
            try {
               if (!interaction.deferred && !interaction.replied) {
                  await interaction.deferReply({ flags: 64 }).catch(() => {});
               }
               await interaction
                  .editReply({
                     content: 'لا يمكن تشغيل إعداد في قناة صوتية استخدمها في قناة نصية أولاً',
                     flags: 64,
                  })
                  .catch(() => {});
            } catch (e) {
               imp.logger.warn('Setup channel type check failed - interaction expired');
            }
            return;
         }
      }
      await interaction.deferReply({ flags: 64 }).catch(() => {});
      try {
         if (channelWillBeDeleted) {
            await interaction
               .editReply({
                  content:
                     'إعادة إعداد مكتشفة هذه القناة ستحذف قريباً الإعداد مستمر تحقق من الفئة الجديدة quran للوحة التحكم والتأكيد النهائي',
               })
               .catch(() => {});
            imp.logger.info(
               `Guild ${guildId} Re-setup from doomed channel ${interaction.channelId} warned user`,
            );
         } else {
            await interaction.editReply({ content: 'جاري إعداد فئة القرآن' }).catch(() => {});
         }
         const setupResult = await setupQuranCategory(interaction.guild, interaction, {
            channelWillBeDeleted,
         });
         const successEmbed = {
            embeds: [
               {
                  color: 0x1e1f22,
                  title: `${isReSetup ? 'إعادة إعداد' : 'إعداد'} فئة القرآن`,
                  description: `تم ${isReSetup ? 'تحديث' : 'إنشاء'} الفئة والقنوات بنجاح`,
                  fields: [
                     { name: 'الفئة', value: setupResult.category.name, inline: true },
                     {
                        name: 'الصوتي',
                        value: setupResult.voiceChannel.name,
                        inline: true,
                     },
                     {
                        name: 'النصي',
                        value: setupResult.textChannel.name,
                        inline: true,
                     },
                     {
                        name: 'الأذكار',
                        value: setupResult.azkarChannel.name,
                        inline: true,
                     },
                  ],
               },
            ],
         };
         if (!channelWillBeDeleted) {
            try {
               await interaction.editReply({ ...successEmbed, content: null });
            } catch (successError) {
               imp.logger.error('Failed success editReply', successError);
               try {
                  await interaction.followUp(successEmbed);
               } catch (followError) {
                  imp.logger.error('Failed success followUp', followError);
                  const systemChannel = interaction.guild.systemChannel;
                  if (systemChannel) {
                     await systemChannel.send({
                        content: 'تم إعداد فئة القرآن بنجاح تفاصيل أدناه',
                        embeds: successEmbed.embeds,
                     });
                  }
               }
            }
         } else {
            imp.logger.info(
               `Guild ${guildId} Skipping interaction success channel deleted Panel already in new channel`,
            );
            const systemChannel = interaction.guild.systemChannel;
            if (systemChannel) {
               await systemChannel.send({
                  content: `إعادة إعداد مكتملة من <@${interaction.user.id}> تحقق من قناة التحكم في فئة quran`,
                  embeds: successEmbed.embeds,
               });
            }
         }
      } catch (error) {
         if (
            !(
               error.message?.includes('Missing Permissions') ||
               error.message?.includes('Missing Access') ||
               error.code === 50013
            )
         ) {
            imp.logger.error('Error in setup', error);
            imp.logger.error(`Stack trace ${error.stack}`);
         }
         let errorMsg =
            'حدث خطأ أثناء تنفيذ الإعداد يرجى التحقق من الصلاحيات والمحاولة لاحقاً';
         if (
            error.code === 50013 ||
            error.message?.includes('Missing Permissions') ||
            error.message?.includes('Missing Access')
         ) {
            errorMsg = `فشل الإعداد بسبب نقص في صلاحيات البوت\n**الحل الموصى به**\n1 منح البوت صلاحية **Administrator** مؤقتاً\n2 تنفيذ أمر /إعداد\n3 إزالة صلاحية Administrator بعد اكتمال الإعداد`;
         }
         if (!channelWillBeDeleted) {
            try {
               await interaction.editReply({ content: errorMsg, flags: 64 });
            } catch (editError) {
               imp.logger.error('Failed error editReply', editError);
               try {
                  await interaction.followUp({ content: errorMsg, flags: 64 });
               } catch (followError) {
                  imp.logger.error('Failed error followUp', followError);
                  const systemChannel = interaction.guild.systemChannel;
                  if (systemChannel) await systemChannel.send(errorMsg);
               }
            }
         } else {
            imp.logger.info(
               `Guild ${guildId} Skipping interaction error using system channel`,
            );
            const systemChannel = interaction.guild.systemChannel;
            if (systemChannel) {
               await systemChannel.send(
                  `خطأ في إعادة الإعداد من <@${interaction.user.id}> ${errorMsg} القناة القديمة حذفت`,
               );
            }
         }
      }
   },
};
