const logger = require('@logging/logger');

/**
 * Cache service stub - all caching operations are now disabled
 * Data is fetched directly from remote endpoint on each load
 * https://github.com/hub-mgv/QuranBotData
 */

async function loadCachedDataFromFirebase() {
    return {};
}

async function saveCachedDataToFirebase() {
    return true;
}

module.exports.loadCachedDataFromFirebase = loadCachedDataFromFirebase;
module.exports.saveCachedDataToFirebase = saveCachedDataToFirebase;
