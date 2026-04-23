//const logger = require("@logger")

async function restoreRuntimeStates() {
   //logger.error("")
   return { success: false, restored: [], failed: [] };
}
module.exports.restoreRuntimeStates = restoreRuntimeStates;
