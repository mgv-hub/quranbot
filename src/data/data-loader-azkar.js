const logger = require('@logging/logger');
const { fetchAdhkarData } = require('@data-loader-http-core_data');
const { validateAdhkarData } = require('@data-loader-validator-core_data');
const { _adhkar_fallback_data_ } = require('@data/data-loader-constants');

// Load adhkar data from remote source with validation and graceful fallback
async function loadAzkarData() {
    try {
        // Fetch fresh adhkar dataset from configured endpoint
        const data = await fetchAdhkarData();

        // Validate structure before assigning to global state
        if (!validateAdhkarData(data)) {
            throw new Error('Invalid adhkar data structure');
        }

        global.azkarData = data;
        logger.info(`Loaded ${data.length} adhkar categories from new system`);

        // Log total entry count for monitoring and debugging
        let totalAdhkar = 0;
        data.forEach((cat) => {
            if (cat.array && Array.isArray(cat.array)) {
                totalAdhkar += cat.array.length;
            }
        });
        logger.info(`Total adhkar entries: ${totalAdhkar}`);

        return true;
    } catch (error) {
        // On failure, fall back to hardcoded safe dataset to maintain functionality
        logger.warn('Failed to load new adhkar data from adhkar.json ' + error.message + ' using fallback data');
        global.azkarData = _adhkar_fallback_data_;
        return true;
    }
}

module.exports.loadAzkarData = loadAzkarData;
