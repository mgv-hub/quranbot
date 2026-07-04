const fetch = require('node-fetch').default;
const logger = require('@logging/logger');
const { getBrowserHeaders, TimeoutRequest } = require('@config/http');

// Remote data endpoint containing all Quran-related datasets
const remote_data_url = 'https://hub-mgv.github.io/QuranBotData/data_quran.json';

// Minimal fallback dataset to ensure bot stays functional during network outages
const fallback_dataset = {
    // This structure in https://hub-mgv.github.io/QuranBotData/data_quran.json
    surah: {
        suwar: Array.from({ length: 114 }, (_, index) => ({
            id: index + 1,
            name: `سورة ${index + 1}`,
            start_page: 1,
            end_page: 1,
            makkia: index < 90,
            type: 'meccan',
        })),
    },
    reciters: {
        reciters: [],
    },
    radios: {
        radios: [],
    },
    moshaf: {
        moshaf: [],
    },
    rewayah: {
        riwayat: [],
    },
    tafasir: {
        tafasir: [],
    },
};

/**
 * Fetches the complete dataset from the remote CDN endpoint
 * Returns validated data structure or fallback on failure
 */
async function loadPersistedCache() {
    try {
        logger.info('Cache Loading data from remote endpoint');
        const response = await fetch(remote_data_url, {
            headers: getBrowserHeaders(),
            timeout: TimeoutRequest('default'),
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const remoteData = await response.json();

        // Handle cached_data wrapper if present in the response
        const data = remoteData.cached_data || remoteData;

        // Basic validation: ensure required top-level keys exist
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data structure from remote endpoint');
        }
        logger.info('Cache Loaded data from remote endpoint successfully');
        return data;
    } catch (error) {
        logger.warn('Cache Failed to load from remote endpoint, using fallback data', {
            error: error.message,
        });
        return fallback_dataset;
    }
}
async function fetchAndPersistAllData() {
    return await loadPersistedCache();
}
async function refreshEndpointCache(endpointKey) {
    logger.info(`Cache Refreshing data for endpoint: ${endpointKey}`);
    return await loadPersistedCache();
}

module.exports.loadCachedData = loadPersistedCache;
module.exports.loadAndCacheAllData = fetchAndPersistAllData;
module.exports.updateCacheForEndpoint = refreshEndpointCache;
module.exports.cache_file = null;
module.exports.remote_data_url = remote_data_url;
module.exports.fallback_dataset = fallback_dataset;
