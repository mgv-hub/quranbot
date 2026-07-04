// require('pathlra-aliaser')();

// const { ChannelType, PermissionsBitField } = require('discord.js');
// const logger = require('@logging/logger');
// const { isSpecialUser } = require('@auth/auth-manager');
// const { createStandardEmbed } = require('@ui/embedFactory');

// module.exports = {
//     customId: 'admin_warn_setup',
//     async execute(interaction) {
//         if (!isSpecialUser(interaction.user.id)) {
//             return interaction.reply({
//                 content: 'This feature is available for the developers only',
//                 flags: 64,
//             });
//         }

//         await interaction.deferUpdate();

//         const actionId = interaction.customId;
//         const targetGuildId = actionId.replace('admin_warn_setup_', '');
//         const botClient = global.client;
//         const targetGuild = botClient.guilds.cache.get(targetGuildId);

//         if (!targetGuild) {
//             return interaction.followUp({ content: 'Server not found', flags: 64 });
//         }
//         if (global.setupGuilds && global.setupGuilds[targetGuildId]) {
//             return interaction.followUp({
//                 content: 'This server is already set up and does not require a warning.',
//                 flags: 64,
//             });
//         }
//         let targetChannel = targetGuild.systemChannel;
//         if (!targetChannel || !targetChannel.isTextBased() || !targetChannel.permissionsFor(targetGuild.members.me)?.has(PermissionsBitField.Flags.SendMessages)) {
//             targetChannel = targetGuild.channels.cache.find(
//                 (ch) => ch.type === ChannelType.GuildText && ch.permissionsFor(targetGuild.members.me)?.has(PermissionsBitField.Flags.SendMessages)
//             );
//         }
//         if (!targetChannel) {
//             return interaction.followUp({
//                 content: 'No valid text channel found to send the warning (bot lacks send permissions).',
//                 flags: 64,
//             });
//         }

//         const daysInServer = Math.floor((Date.now() - targetGuild.joinedTimestamp) / (1000 * 60 * 60 * 24));
//         const warningEmbed = createStandardEmbed()
//             .setTitle('Important Warning: Bot Setup Required')
//             .setDescription(
//                 'مرحباً إدارة السيرفر،\n\n' +
//                 'لقد لاحظنا أن بوت القرآن الكريم لم يتم إعداده في هذا السيرفر بعد.\n' +
//                 `**مدة وجود البوت في السيرفر:** ${daysInServer} يوم\n\n` +
//                 'نقوم بإرسال هذا التنويه حرصاً منا على توفير موارد البوت وضمان تقديم أفضل خدمة للسيرفرات النشطة.\n\n' +
//                 '**ماذا يجب أن تفعل؟**\n' +
//                 'يرجى استخدام الأمر `/إعداد` لإنشاء قنوات البوت وتفعيل ميزاته.\n\n' +
//                 '**ملاحظة هامة:**\n' +
//                 'في حال لم يتم إعداد البوت خلال 7 أيام من تاريخ هذه الرسالة، سيتم إخراجه تلقائياً من السيرفر لتوفير الموارد للسيرفرات الأخرى.\n\n' +
//                 'شكراً لتفهمكم وتعاونكم.'
//             )

//         try {
//             await targetChannel.send({ embeds: [warningEmbed] });
//             logger.info(`Admin ${interaction.user.tag} sent setup warning to guild ${targetGuild.name} (${targetGuildId})`);

//             const successEmbed = createStandardEmbed()
//                 .setTitle('Warning Sent Successfully')
//                 .setDescription(`Setup warning has been sent to channel \`${targetChannel.name}\` in server \`${targetGuild.name}\`.`);

//             await interaction.followUp({ embeds: [successEmbed], flags: 64 });
//         } catch (err) {
//             logger.error('Error sending setup warning', err);
//             await interaction.followUp({
//                 content: `An error occurred while sending the warning: ${err.message}`,
//                 flags: 64,
//             });
//         }
//     },
// };
