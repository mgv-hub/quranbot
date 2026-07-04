const { isAuthorized } = require('../../state/GuildStateManager');
const { ERRORS } = require('@interactions/buttons/sys-config');

// Check if the interaction user has permission to execute the requested action
function checkInteractionAuth(interaction, guildState, actionId) {
    if (!isAuthorized(interaction, guildState, actionId)) {
        return {
            authorized: false,
            message: guildState.controlMode === 'everyone' ? ERRORS.ACTION_DENIED : ERRORS.ADMIN_REQUIRED,
        };
    }
    return { authorized: true, message: null };
}

module.exports.checkInteractionAuth = checkInteractionAuth;
