require('pathlra-aliaser')();
const imp = require('@loader-core_bootstrap');
function getErrorType(error) {
   if (!error) return 'UNKNOWN_ERROR';
   if (
      error.message?.includes('Unknown interaction') ||
      error.message?.includes('10062') ||
      error.message?.includes('InteractionNotReplied') ||
      error.code === 10062
   ) {
      return 'INTERACTION_EXPIRED';
   }
   if (
      error.message?.includes('Missing Permissions') ||
      error.message?.includes('50013') ||
      error.message?.includes('Missing Access') ||
      error.code === 50013
   ) {
      return 'PERMISSION_DENIED';
   }
   if (
      error.message?.includes('VoiceConnection not available') ||
      error.message?.includes('4004') ||
      error.code === 4004
   ) {
      return 'VOICE_CONNECTION_ERROR';
   }
   if (
      error.message?.includes('Cannot read properties of undefined') ||
      error.message?.includes('Cannot destructure property') ||
      error.message?.includes('Cannot read property')
   ) {
      return 'STATE_ERROR';
   }
   if (
      error.message?.includes('Unknown Message') ||
      error.message?.includes('10008') ||
      error.code === 10008
   ) {
      return 'MESSAGE_NOT_FOUND';
   }
   if (
      error.message?.includes('ETIMEDOUT') ||
      error.message?.includes('ECONNRESET') ||
      error.message?.includes('fetch failed')
   ) {
      return 'NETWORK_ERROR';
   }
   return 'GENERAL_ERROR';
}
function getErrorMessage(errorType, originalMessage = '') {
   switch (errorType) {
      case 'INTERACTION_EXPIRED':
         return 'التفاعل لم يعد صالحًا يرجى استخدام الأمر control لإنشاء لوحة تحكم جديدة';
      case 'PERMISSION_DENIED':
         return 'البوت لا يملك الصلاحيات المطلوبة للقيام بهذا الإجراء';
      case 'VOICE_CONNECTION_ERROR':
         return 'حدث خطأ في الاتصال الصوتي يرجى استخدام leave ثم join مرة أخرى';
      case 'STATE_ERROR':
         return 'جاري تهيئة السيرفر يرجى المحاولة مرة أخرى بعد بضع ثوان';
      case 'MESSAGE_NOT_FOUND':
         return 'رسالة التحكم غير موجودة يرجى استخدام control لإنشاء لوحة جديدة';
      case 'NETWORK_ERROR':
         return 'خطأ في الاتصال بالشبكة يرجى المحاولة مرة أخرى';
      default:
         imp.logger.debug('Uncategorized Error: ' + (originalMessage || 'Unknown'));
         return 'حدث خطأ أثناء معالجة طلبك يرجى المحاولة مرة أخرى لاحقًا';
   }
}
async function handleInteractionError(interaction, error, context) {
   try {
      const errorType = getErrorType(error);
      if (errorType === 'INTERACTION_EXPIRED' || errorType === 'MESSAGE_NOT_FOUND') {
         imp.logger.debug(
            `Interaction Expired Or Message Not Found In ${context} Skipping Error Message`,
         );
         return;
      }
      if (errorType !== 'PERMISSION_DENIED') {
         imp.logger.error(`Interaction Error ${context} ${errorType}`, error);
      }
      const userMessage = getErrorMessage(errorType, error.message);
      try {
         if (!interaction.replied && !interaction.deferred) {
            if (interaction.isCommand()) {
               await interaction
                  .reply({
                     content: userMessage,
                     flags: imp.MessageFlags.Ephemeral,
                  })
                  .catch(() => {});
            } else {
               await interaction.deferUpdate().catch(() => {});
               await interaction
                  .followUp({
                     content: userMessage,
                     flags: imp.MessageFlags.Ephemeral,
                  })
                  .catch(() => {});
            }
         } else if (interaction.deferred && !interaction.replied) {
            await interaction
               .editReply({
                  content: userMessage,
                  flags: imp.MessageFlags.Ephemeral,
               })
               .catch(() => {});
         } else {
            await interaction
               .followUp({
                  content: userMessage,
                  flags: imp.MessageFlags.Ephemeral,
               })
               .catch(() => {});
         }
      } catch (replyError) {
         const replyErrorType = getErrorType(replyError);
         if (
            replyErrorType === 'INTERACTION_EXPIRED' ||
            replyErrorType === 'MESSAGE_NOT_FOUND'
         ) {
            imp.logger.debug('Cannot Send Error Message Interaction Or Message Expired');
            return;
         }
         imp.logger.error('Failed To Send Error Message To User', replyError);
      }
      if (errorType === 'STATE_ERROR' && context === 'interactionHandler') {
         try {
            const guildId = interaction.guildId;
            const state = imp.getGuildState(guildId);
            if (state) {
               await imp.updateControlPanel(interaction, state);
               imp.logger.info(`Recovered Control Panel For Guild ${guildId} After Error`);
            }
         } catch (recoveryError) {
            imp.logger.debug('Failed To Recover Control Panel After Error');
         }
      }
   } catch (finalError) {
      imp.logger.critical('Complete Failure In Handling Interaction Error', finalError);
   }
}
module.exports.getErrorType = getErrorType;
module.exports.getErrorMessage = getErrorMessage;
module.exports.handleInteractionError = handleInteractionError;
