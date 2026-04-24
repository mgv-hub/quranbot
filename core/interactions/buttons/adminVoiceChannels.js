require('pathlra-aliaser')();
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const logger = require('@logger');

module.exports = {
   customId: 'admin_voice_pagination',
   async execute(interaction) {
      const userId = interaction.user.id;
      const isSpecialUser = global.SPE_USER_IDS.includes(userId);
      if (!isSpecialUser) {
         return interaction.reply({
            content: 'This feature is available for the developer only',
            flags: 64,
         });
      }
      try {
         await interaction.deferUpdate();
         const client = global.client;
         const voiceChannels = [];
         client.guilds.cache.forEach((guild) => {
            if (guild.members.me?.voice?.channelId) {
               const voiceChannel = guild.channels.cache.get(guild.members.me.voice.channelId);
               if (voiceChannel) {
                  voiceChannels.push({
                     guildId: guild.id,
                     guildName: guild.name,
                     channelId: voiceChannel.id,
                     channelName: voiceChannel.name,
                  });
               }
            }
         });
         if (voiceChannels.length === 0) {
            return interaction.followUp({
               content: 'Bot is not connected to any voice channel',
               flags: 64,
            });
         }
         const itemsPerPage = 10;
         const totalPages = Math.ceil(voiceChannels.length / itemsPerPage);
         let currentPage = 0;
         if (interaction.customId === 'admin_prev_voice') {
            const embedFooter = interaction.message.embeds[0]?.footer?.text;
            if (embedFooter) {
               const match = embedFooter.match(/Page (\d+)\/(\d+)/);
               if (match) {
                  currentPage = parseInt(match[1], 10) - 1;
               }
            }
            currentPage = Math.max(0, currentPage - 1);
         } else if (interaction.customId === 'admin_next_voice') {
            const embedFooter = interaction.message.embeds[0]?.footer?.text;
            if (embedFooter) {
               const match = embedFooter.match(/Page (\d+)\/(\d+)/);
               if (match) {
                  currentPage = parseInt(match[1], 10) - 1;
               }
            }
            currentPage = Math.min(totalPages - 1, currentPage + 1);
         } else if (interaction.customId === 'admin_refresh_voice') {
            currentPage = 0;
         }
         const startIndex = currentPage * itemsPerPage;
         const endIndex = Math.min(startIndex + itemsPerPage, voiceChannels.length);
         const currentVoiceChannels = voiceChannels.slice(startIndex, endIndex);
         const embed = new EmbedBuilder()
            .setColor(0x1e1f22)
            .setTitle('Active Voice Channels')
            .setDescription(`**Total Voice Channels: ${voiceChannels.length}**`);
         for (const vc of currentVoiceChannels) {
            embed.addFields({
               name: `${vc.guildName} - ${vc.channelName}`,
               value: `\u200b`,
               inline: false,
            });
         }
         embed.setFooter({ text: `Page ${currentPage + 1}/${totalPages}` });
         const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
               .setCustomId('admin_back_to_panel')
               .setLabel('Back to Panel')
               .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
               .setCustomId('admin_prev_voice')
               .setLabel('Previous')
               .setStyle(ButtonStyle.Secondary)
               .setDisabled(currentPage === 0),
            new ButtonBuilder()
               .setCustomId('admin_next_voice')
               .setLabel('Next')
               .setStyle(ButtonStyle.Secondary)
               .setDisabled(currentPage >= totalPages - 1),
            new ButtonBuilder()
               .setCustomId('admin_refresh_voice')
               .setLabel('Refresh')
               .setStyle(ButtonStyle.Secondary),
         );
         await interaction.editReply({
            embeds: [embed],
            components: [actionRow],
         });
      } catch (error) {
         logger.error('Error In Admin Voice Channels Pagination', error);
         try {
            if (!interaction.replied && !interaction.deferred) {
               await interaction.deferUpdate().catch(() => {});
            }
            await interaction
               .followUp({
                  content: 'حدث خطأ ' + error.message,
                  flags: 64,
               })
               .catch(() => {});
         } catch (replyError) {
            logger.error('Error Replying To Interaction', replyError);
         }
      }
   },
};
