const { loadCachedData } = require('@data/data-cache');
const logger = require('@logging/logger');

async function getCachedSurahData() {
    try {
        const cache = await loadCachedData();
        return cache.surah || {};
    } catch (error) {
        logger.error('Error getting cached surah data', error);
        return {};
    }
}

async function getCachedRecitersData() {
    try {
        const cache = await loadCachedData();
        return cache.reciters || {};
    } catch (error) {
        logger.error('Error getting cached reciters data', error);
        return {};
    }
}

async function getCachedRadiosData() {
    try {
        const cache = await loadCachedData();
        return cache.radios || {};
    } catch (error) {
        logger.error('Error getting cached radios data', error);
        return {};
    }
}

module.exports.getCachedSurahData = getCachedSurahData;
module.exports.getCachedRecitersData = getCachedRecitersData;
module.exports.getCachedRadiosData = getCachedRadiosData;
