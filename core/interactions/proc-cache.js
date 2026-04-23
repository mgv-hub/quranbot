require('pathlra-aliaser')();

const {
   interactionCache,
   MAX_INTERACTION_CACHE_SIZE,
   INTERACTION_CACHE_TTL_MS,
} = require('@interactionCache-core_interactions');
const imp = require('@loader-core_bootstrap');

function checkDuplicateInteraction(interaction) {
   const interactionId = `${interaction.guildId}-${interaction.user.id}-${interaction.id}`;
   if (interactionCache.has(interactionId)) {
      imp.logger.debug(`Ignored Duplicate Interaction ${interactionId}`);
      return true;
   }
   return false;
}

function addToInteractionCache(interaction) {
   const interactionId = `${interaction.guildId}-${interaction.user.id}-${interaction.id}`;
   if (interactionCache.size >= MAX_INTERACTION_CACHE_SIZE) {
      const firstKey = interactionCache.keys().next().value;
      interactionCache.delete(firstKey);
   }
   interactionCache.set(interactionId, Date.now());
   setTimeout(() => {
      interactionCache.delete(interactionId);
   }, INTERACTION_CACHE_TTL_MS);
}

module.exports.checkDuplicateInteraction = checkDuplicateInteraction;
module.exports.addToInteractionCache = addToInteractionCache;
module.exports.interactionCache = interactionCache;
