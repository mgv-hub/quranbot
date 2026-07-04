const { isAuthorized, isPublicFeature, authorizeInteraction } = require('@auth/auth-manager');

// Consolidated public feature detection and exemption logic
const EXCLUDED_FROM_AUTH = ['submit_complaint', 'open_complaint_modal', 'cancel_support'];

function isExcludedFromAuth(interactionType) {
    return EXCLUDED_FROM_AUTH.includes(interactionType);
}

async function checkAuthorization(interaction, guildState, interactionType) {
    if (
        isPublicFeature(interaction) ||
        isExcludedFromAuth(interactionType) ||
        (interactionType && interactionType.startsWith('notify_')) ||
        (interactionType && interactionType.startsWith('download_backup_'))
    ) {
        return true;
    }
    return await authorizeInteraction(interaction, guildState, interactionType);
}

module.exports.checkAuthorization = checkAuthorization;
module.exports.isExcludedFromAuth = isExcludedFromAuth;
module.exports.isPublicFeature = isPublicFeature;
module.exports.EXCLUDED_FROM_AUTH = EXCLUDED_FROM_AUTH;
