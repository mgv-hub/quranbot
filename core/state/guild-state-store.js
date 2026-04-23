require('pathlra-aliaser');

const logger = require('@logger');

const guildStates = new Map();
global.guildStates = guildStates;

function getGuildStatesMap() {
   return guildStates;
}

function hasGuildState(guildId) {
   return guildStates.has(guildId);
}

function setGuildState(guildId, state) {
   guildStates.set(guildId, state);
   logger.info('Created New State For Guild ' + guildId);
}

function getGuildStateById(guildId) {
   return guildStates.get(guildId);
}

function deleteGuildState(guildId) {
   return guildStates.delete(guildId);
}

module.exports.getGuildStatesMap = getGuildStatesMap;
module.exports.hasGuildState = hasGuildState;
module.exports.setGuildState = setGuildState;
module.exports.getGuildStateById = getGuildStateById;
module.exports.deleteGuildState = deleteGuildState;
