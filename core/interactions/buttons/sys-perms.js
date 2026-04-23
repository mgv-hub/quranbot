require('pathlra-aliaser');

const { isAuthorized } = require('@GuildStateManager-core_state');
const { ERRORS } = require('@sys-config-core_interactions_buttons');

function checkInteractionAuth(interaction, state, customId) {
   if (!isAuthorized(interaction, state, customId)) {
      return {
         authorized: false,
         message: state.controlMode === 'everyone' ? ERRORS.ACTION_DENIED : ERRORS.ADMIN_REQUIRED,
      };
   }
   return { authorized: true, message: null };
}

module.exports.checkInteractionAuth = checkInteractionAuth;
