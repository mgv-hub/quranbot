require('pathlra-aliaser');

const logger = require('@logger');

async function handleSystemError(interaction, guildId, error) {
   logger.error('Error Executing Action In Guild ' + guildId, error);
   try {
      await interaction.deferUpdate().catch(() => {});
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

async function sendErrorReply(interaction, content) {
   try {
      await interaction
         .followUp({
            content: content,
            flags: 64,
         })
         .catch(() => {});
   } catch (replyError) {
      logger.error('Error Sending Error Reply', replyError);
   }
}

module.exports.handleSystemError = handleSystemError;
module.exports.sendErrorReply = sendErrorReply;
