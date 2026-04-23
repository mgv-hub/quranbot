require('pathlra-aliaser')();
const imp = require('@loader-core_bootstrap');
const client = global.client;
const { handleInteraction } = require('@interactionProcessor-core_interactions');
const { getErrorType } = require('@interactionErrors-core_interactions');

client.on('interactionCreate', async (interaction) => {
   try {
      if (
         !interaction.isCommand() &&
         !interaction.isButton() &&
         !interaction.isStringSelectMenu() &&
         !interaction.isModalSubmit()
      ) {
         return;
      }
      if (interaction.user.id === client.user.id) {
         return;
      }
      const interactionId = `${interaction.guildId}-${interaction.user.id}-${interaction.id}`;
      if (global.interactionRateLimits && global.interactionRateLimits.has(interactionId)) {
         const lastTime = global.interactionRateLimits.get(interactionId);
         const now = Date.now();
         if (now - lastTime < 500) {
            imp.logger.debug(`Ignored Fast Duplicate Interaction ${interactionId}`);
            return;
         }
      }
      if (!global.interactionRateLimits) {
         global.interactionRateLimits = new Map();
      }
      global.interactionRateLimits.set(interactionId, Date.now());
      await handleInteraction(interaction);
   } catch (criticalError) {
      imp.logger.critical('Unexpected Error In Interaction Handler');
      try {
         if (interaction && !interaction.replied && !interaction.deferred) {
            const errorType = getErrorType(criticalError);
            if (errorType !== 'INTERACTION_EXPIRED') {
               await interaction.deferUpdate();
               await interaction.editReply({
                  content: 'حدث خطأ حرج في النظام جاري المحاولة لاستعادة الخدمة',
                  flags: imp.MessageFlags.Ephemeral,
               });
               setTimeout(async () => {
                  try {
                     await interaction.editReply({
                        content: 'تم استعادة النظام بنجاح يرجى المحاولة مرة أخرى',
                        flags: imp.MessageFlags.Ephemeral,
                     });
                  } catch (recoveryError) {
                     imp.logger.debug('Failed To Recover Error Message');
                  }
               }, 2000);
            }
         }
      } catch (replyError) {
         imp.logger.error('Failed To Send Critical Error Message To User');
      }
   }
});

require('@globalAll');
