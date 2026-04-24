require('pathlra-aliaser')();
const imp = require('@loader-core_bootstrap');
async function checkGlobalCooldown(interaction) {
   const userId = interaction.user.id;
   if (imp.isUserInGlobalCooldown(userId)) {
      try {
         if (!interaction.replied && !interaction.deferred) {
            if (interaction.isCommand()) {
               await interaction.reply({
                  content:
                     'أنت في وضع الانتظار المؤقت بسبب كثرة الطلبات. يرجى المحاولة لاحقًا.',
                  ephemeral: true,
               });
            } else {
               await interaction.reply({
                  content:
                     'أنت في وضع الانتظار المؤقت بسبب كثرة الطلبات. يرجى المحاولة لاحقًا.',
                  ephemeral: true,
               });
            }
         } else if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
               content: 'أنت في وضع الانتظار المؤقت بسبب كثرة الطلبات. يرجى المحاولة لاحقًا.',
               ephemeral: true,
            });
         }
         imp.logger.warn(`Blocked Interaction From User ${userId} Due To Global Cooldown`);
         return true;
      } catch (error) {
         imp.logger.debug('Failed To Send Cooldown Message To User');
         return true;
      }
   }
   const rateLimitResult = imp.checkRateLimit(userId, interaction.guildId);
   if (!rateLimitResult.valid) {
      try {
         if (!interaction.replied && !interaction.deferred) {
            if (interaction.isCommand()) {
               await interaction.reply({
                  content: rateLimitResult.message,
                  ephemeral: true,
               });
            } else {
               await interaction.reply({
                  content: rateLimitResult.message,
                  ephemeral: true,
               });
            }
         } else if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
               content: rateLimitResult.message,
               ephemeral: true,
            });
         }
         imp.logger.warn(`Blocked Interaction From User ${userId} Due To Rate Limit`);
         return true;
      } catch (error) {
         imp.logger.error('Failed To Send Rate Limit Message');
         return true;
      }
   }
   return false;
}

module.exports.checkGlobalCooldown = checkGlobalCooldown;
