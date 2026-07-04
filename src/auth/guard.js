const { getGuildState } = require('../state/GuildStateManager');
const { authorizeInteraction } = require('@auth/auth-manager');
const { safeError } = require('@interactions/flow/deferReply');

// Replaced redundant state resolution and auth checking with unified wrappers
async function checkAuthorization(interaction, actionId = null) {
    const guildId = interaction.guildId;
    if (!guildId) return false;
    const guildState = getGuildState(guildId);
    if (!guildState) {
        await safeError(interaction, 'لم يتم العثور على حالة السيرفر');
        return false;
    }
    return await authorizeInteraction(interaction, guildState, actionId);
}

function resolveGuildState(interaction) {
    const guildId = interaction.guildId;
    if (!guildId) return { guildId: null, guildState: null };
    const guildState = getGuildState(guildId);
    return { guildId, guildState };
}

module.exports.checkAuthorization = checkAuthorization;
module.exports.resolveGuildState = resolveGuildState;
