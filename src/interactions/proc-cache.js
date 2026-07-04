const { interactionCache, max_interaction_cache_size, interaction_cache_ttl_ms } = require('@interactions/interactionCache');
const coreLoader = require('@bot/bootstrap');

// Check if an interaction has already been processed recently to prevent duplicates
function checkDuplicateInteraction(interaction) {
    const interactionId = `${interaction.guildId}-${interaction.user.id}-${interaction.id}`;

    if (interactionCache.has(interactionId)) {
        coreLoader.logger.debug(`Ignored Duplicate Interaction ${interactionId}`);
        return true;
    }
    return false;
}

// Add interaction to cache with automatic expiration and size management
function addToInteractionCache(interaction) {
    const interactionId = `${interaction.guildId}-${interaction.user.id}-${interaction.id}`;
    if (interactionCache.size >= max_interaction_cache_size) {
        const oldestKey = interactionCache.keys().next().value;
        interactionCache.delete(oldestKey);
    }

    interactionCache.set(interactionId, Date.now());

    setTimeout(() => {
        interactionCache.delete(interactionId);
    }, interaction_cache_ttl_ms);
}

module.exports.checkDuplicateInteraction = checkDuplicateInteraction;
module.exports.addToInteractionCache = addToInteractionCache;
module.exports.interactionCache = interactionCache;
