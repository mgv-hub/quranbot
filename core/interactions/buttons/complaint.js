require('pathlra-aliaser')();
const {
   ModalBuilder,
   TextInputBuilder,
   TextInputStyle,
   ActionRowBuilder,
   EmbedBuilder,
   ButtonBuilder,
   ButtonStyle,
} = require('discord.js');
const logger = require('@logger');

module.exports = {
   customId: 'submit_complaint',
   async execute(interaction) {
      const userId = interaction.user.id;
      const isSpecialUser = global.SPE_USER_IDS.includes(userId);

      if (isSpecialUser) {
         const adminRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
               .setCustomId('admin_server_list')
               .setLabel('Server List')
               .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
               .setCustomId('admin_send_message')
               .setLabel('Send Message')
               .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
               .setCustomId('admin_bot_stats')
               .setLabel('Bot Statistics')
               .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
               .setCustomId('admin_response_modal')
               .setLabel('Reply to Complaint')
               .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
               .setCustomId('admin_voice_channels')
               .setLabel('Voice Channels')
               .setStyle(ButtonStyle.Secondary),
         );
         const adminRow2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('admin_close_panel').setLabel('Close').setStyle(ButtonStyle.Secondary),
         );
         const adminEmbed = new EmbedBuilder()
            .setColor(0x1e1f22)
            .setTitle('Developer Control Panel')
            .setDescription(
               '**Welcome to the Developer Control Panel**\n' +
                  'This panel is available only to you and allows you to:',
            )
            .addFields(
               {
                  name: 'Server List',
                  value: 'View all servers where the bot is present',
                  inline: true,
               },
               {
                  name: 'Send Message',
                  value: 'Send an administrative message to any server',
                  inline: true,
               },
               {
                  name: 'Bot Statistics',
                  value: 'View detailed bot statistics',
                  inline: true,
               },
               {
                  name: 'Reply to Complaint',
                  value: 'Respond to submitted complaints',
                  inline: true,
               },
               {
                  name: 'Voice Channels',
                  value: 'View all voice channels where bot is connected',
                  inline: true,
               },
               {
                  name: 'Leave Server',
                  value: 'Remove the bot from any server',
                  inline: true,
               },
               {
                  name: 'Protection System',
                  value: 'Active and Protected',
                  inline: true,
               },
            );
         await interaction.reply({
            embeds: [adminEmbed],
            components: [adminRow, adminRow2],
            flags: 64,
         });
      } else {
         const supportEmbed = new EmbedBuilder()
            .setColor(0x1e1f22)
            .setTitle('مركز الدعم والمساعدة')
            .setDescription('**نقدر اهتمامك بالبوت ونسعد بمساعدتك**\n\n' + 'يمكنك التواصل معنا عبر إحدى الطرق التالية:')
            .addFields(
               {
                  name: 'تقديم شكوى أو اقتراح',
                  value: 'أرسل لنا شكواك أو اقتراحك مباشرة وسيتم مراجعتها من قبل فريق الدعم',
                  inline: false,
               },
               {
                  name: 'سيرفر الدعم المباشر',
                  value: 'انضم لسيرفر الدعم للتواصل المباشر والحصول على مساعدة أسرع',
                  inline: false,
               },
            );
         const supportRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
               .setCustomId('open_complaint_modal')
               .setLabel('تقديم شكوى/اقتراح')
               .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
               .setLabel('سيرفر الدعم')
               .setStyle(ButtonStyle.Link)
               .setURL('https://discord.gg/cgRMtuXkJf'),
         );

         await interaction.reply({
            embeds: [supportEmbed],
            components: [supportRow],
            flags: 64,
         });
      }
   },
};
