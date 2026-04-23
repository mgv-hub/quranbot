require('pathlra-aliaser');
const { PermissionsBitField } = require('discord.js');
const logger = require('@logger');
const ALLOWED_EVERYONE_ACTIONS = [
   'next',
   'prev',
   'select_surah',
   'select_reciter',
   'toggle_radio',
   'prev_page',
   'next_page',
];
const ADMIN_ROLE_KEYWORDS = ['admin', 'quran', 'islamic', 'islam'];
function isAuthorized(interaction, state, interactionType) {
   try {
      const member = interaction.member;
      if (!member) {
         logger.debug('Member Not Found In Interaction ' + interactionType);
         return false;
      }
      let isAdmin = false;
      try {
         if (member.permissions && typeof member.permissions.has === 'function') {
            isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
         } else if (member.permissions instanceof PermissionsBitField) {
            isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
         }
      } catch (permError) {
         logger.debug('Permission Check Failed For Interaction ' + interactionType);
      }
      const hasAdminRole =
         member.roles?.cache?.some?.((role) =>
            ADMIN_ROLE_KEYWORDS.some((keyword) => role.name.toLowerCase().includes(keyword)),
         ) || false;
      const isSpecialUser = global.SPE_USER_IDS.includes(interaction.user?.id);
      if (isAdmin || hasAdminRole || isSpecialUser) return true;
      if (state?.controlMode === 'everyone') {
         return ALLOWED_EVERYONE_ACTIONS.includes(interactionType);
      }
      return false;
   } catch (error) {
      logger.error('Authorization Check Error');
      return false;
   }
}
function checkAdminPermission(member) {
   try {
      if (!member) return false;
      if (member.permissions && typeof member.permissions.has === 'function') {
         return member.permissions.has(PermissionsBitField.Flags.Administrator);
      } else if (member.permissions instanceof PermissionsBitField) {
         return member.permissions.has(PermissionsBitField.Flags.Administrator);
      }
      return false;
   } catch {
      return false;
   }
}
function hasAdminRole(member) {
   try {
      if (!member?.roles?.cache) return false;
      return member.roles.cache.some((role) =>
         ADMIN_ROLE_KEYWORDS.some((keyword) => role.name.toLowerCase().includes(keyword)),
      );
   } catch {
      return false;
   }
}
function isSpecialUser(userId) {
   return global.SPE_USER_IDS.includes(userId);
}
module.exports.isAuthorized = isAuthorized;
module.exports.checkAdminPermission = checkAdminPermission;
module.exports.hasAdminRole = hasAdminRole;
module.exports.isSpecialUser = isSpecialUser;
module.exports.ALLOWED_EVERYONE_ACTIONS = ALLOWED_EVERYONE_ACTIONS;
