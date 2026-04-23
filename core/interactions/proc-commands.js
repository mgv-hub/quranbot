require('pathlra-aliaser')();
const imp = require('@loader-core_bootstrap');
const { getErrorType } = require('@interactionErrors-core_interactions');

const PUBLIC_COMMANDS = ['مصادر', 'مواقيت_الصلاة', 'سرعة', 'دليل'];
const ADMIN_COMMANDS = ['خروج', 'دخول', 'دخول_قناة', 'إعداد'];
const CONTROL_COMMANDS = ['تحكم'];
const GUILD_REQUIRED_COMMANDS = ['تحكم', 'خروج', 'دخول', 'دخول_قناة', 'إعداد'];

function isPublicCommand(commandName) {
   return PUBLIC_COMMANDS.includes(commandName);
}

function isAdminCommand(commandName) {
   return ADMIN_COMMANDS.includes(commandName);
}

function isControlCommand(commandName) {
   return CONTROL_COMMANDS.includes(commandName);
}

function requiresGuild(commandName) {
   return GUILD_REQUIRED_COMMANDS.includes(commandName);
}

async function handleCommandInteraction(interaction, state) {
   const commandName = interaction.commandName;
   const guildId = interaction.guildId;
   const userId = interaction.user.id;

   if (!interaction.guild && requiresGuild(commandName)) {
      try {
         if (!interaction.deferred && !interaction.replied) {
            await interaction.reply({
               content: 'هذا الأمر يمكن استخدامه فقط داخل السيرفرات وليس في الرسائل الخاصة',
               flags: 64,
            });
         }
      } catch (error) {
         imp.logger.debug('DM Command Block Reply Failed');
      }
      return false;
   }

   const cooldownResult = imp.checkCooldown(userId, guildId, commandName);

   if (!cooldownResult.allowed) {
      try {
         if (!interaction.deferred && !interaction.replied) {
            await interaction.reply({
               content: imp.getCooldownResponse(cooldownResult.remaining, cooldownResult.type),
               flags: 64,
            });
         }
      } catch (error) {
         imp.logger.debug('Failed to send cooldown message');
      }
      return false;
   }

   if (isAdminCommand(commandName) || isControlCommand(commandName)) {
      if (!imp.isAuthorized(interaction, state, null)) {
         try {
            if (!interaction.deferred && !interaction.replied) {
               await interaction.reply({
                  content: 'تتطلب هذه العملية امتلاك صلاحيات المسؤول (Administrator)',
                  flags: 64,
               });
            }
         } catch (error) {
            imp.logger.debug('Admin Command Auth Failed');
         }
         return false;
      }
   }

   await deferCommandInteraction(interaction, commandName);
   await imp.incrementCommandStats(commandName);
   await executeCommand(interaction, commandName);

   imp.setCooldown(userId, guildId, commandName);

   return true;
}

async function deferCommandInteraction(interaction, commandName) {
   try {
      if (!interaction.deferred && !interaction.replied) {
         if (isPublicCommand(commandName) || !interaction.guild) {
            await interaction.deferReply({ flags: 64 });
         } else if (isAdminCommand(commandName)) {
            await interaction.deferReply({ flags: 64 });
         } else {
            await interaction.deferReply();
         }
      }
   } catch (deferError) {
      const deferErrorType = getErrorType(deferError);
      if (deferErrorType === 'INTERACTION_EXPIRED') {
         imp.logger.debug(`Command Interaction Expired Before Defer ${commandName}`);
         throw deferError;
      }
      throw deferError;
   }
}

async function executeCommand(interaction, commandName) {
   switch (commandName) {
      case 'سرعة':
         await imp.pingCommand.execute(interaction);
         break;
      case 'دخول':
         await imp.joinCommand.execute(interaction);
         break;
      case 'دخول_قناة':
         await imp.joinChannelCommand.execute(interaction);
         break;
      case 'خروج':
         await imp.leaveCommand.execute(interaction);
         break;
      case 'تحكم':
         await imp.controlCommand.execute(interaction);
         break;
      case 'إعداد':
         await imp.setupCommand.execute(interaction);
         break;
      case 'دليل':
         await imp.guideCommand.execute(interaction);
         break;
      case 'مواقيت_الصلاة':
         await imp.prayerTimesCommand.execute(interaction);
         break;
      case 'مصادر':
         await imp.sourcesCommand.execute(interaction);
         break;
      default:
         if (!interaction.replied && !interaction.deferred) {
            await interaction.editReply({
               content: 'لم يتم التعرف على الأمر',
               flags: 64,
            });
         }
   }
}

module.exports.handleCommandInteraction = handleCommandInteraction;
module.exports.isPublicCommand = isPublicCommand;
module.exports.isAdminCommand = isAdminCommand;
module.exports.isControlCommand = isControlCommand;
module.exports.requiresGuild = requiresGuild;
