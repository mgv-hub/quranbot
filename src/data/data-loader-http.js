const fetch = require('node-fetch').default;
const logger = require('@logging/logger');
const { getBrowserHeaders, TimeoutRequest } = require('@config/http');
const { getAdhkarUrl } = require('@data-loader-config-core_data');

// Fetch adhkar data from the configured remote endpoint
async function fetchAdhkarData() {
    try {
        const endpoint = getAdhkarUrl();

        const response = await fetch(endpoint, {
            headers: getBrowserHeaders(),
            timeout: TimeoutRequest('default'),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        logger.error('Error fetching adhkar data', error);
        throw error;
    }
}

module.exports.fetchAdhkarData = fetchAdhkarData;
