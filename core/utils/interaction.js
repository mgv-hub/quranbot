require('pathlra-aliaser')();
const { EmbedBuilder } = require('discord.js');
const { createControlEmbed } = require('@embeds-core_ui');
const {
   createReciterRow,
   createRadioRow,
   createSelectRow,
   createButtonRow,
   createNavigationRow,
} = require('@components-core_ui');
const { saveControlId } = require('@controlIds-core_utils');
const logger = require('@logger');
async function updateControlMessage(interaction, embed, components) {
   try {
      if (interaction.replied || interaction.deferred) {
         const reply = await interaction.editReply({
            embeds: [embed],
            components: components,
         });
         return reply;
      } else {
         const reply = await interaction.update({
            embeds: [embed],
            components: components,
         });
         return reply;
      }
   } catch (error) {
      logger.error('Error Updating Control Message', error);
      if (error.code === 10062 || error.message?.includes('Unknown interaction')) {
         logger.debug('Interaction Expired Cannot Update');
         return null;
      }
      if (error.code === 10008 || error.message?.includes('Unknown Message')) {
         logger.debug('Message Not Found Cannot Update');
         return null;
      }
      try {
         if (interaction.channel && interaction.message) {
            const message = await interaction.channel.messages.fetch(interaction.message.id).catch(() => null);
            if (message) {
               const updatedMessage = await message
                  .edit({
                     embeds: [embed],
                     components: components,
                  })
                  .catch(() => null);
               if (updatedMessage) return updatedMessage;
            }
         }
      } catch (fetchError) {
         logger.error('Error Fetching And Editing Message Directly', fetchError);
      }
      try {
         if (interaction.channel) {
            const newMessage = await interaction.channel
               .send({
                  embeds: [embed],
                  components: components,
               })
               .catch(() => null);
            if (newMessage) {
               try {
                  if (interaction.message && !interaction.message.deleted) {
                     await interaction.message.delete().catch(() => {});
                  }
               } catch (deleteError) {
                  logger.warn('Could Not Delete Old Control Message');
               }
               await saveControlId(interaction.guildId, interaction.channelId, newMessage.id);
               return newMessage;
            }
         }
      } catch (newMessageError) {
         logger.error('Error Sending New Control Message', newMessageError);
      }
      return null;
   }
}
module.exports.updateControlMessage = updateControlMessage;
module.exports.saveControlId = saveControlId;
