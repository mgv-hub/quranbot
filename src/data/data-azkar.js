const fetch = require('node-fetch').default;
const logger = require('@logging/logger');
const { getBrowserHeaders, TimeoutRequest } = require('@config/http');

async function loadRemoteAzkarData() {
    try {
        // Attempt to fetch the latest adhkar dataset from our public repo
        const response = await fetch('https://hub-mgv.github.io/QuranBotData/adhkar.json', {
            headers: getBrowserHeaders(),
            timeout: TimeoutRequest('default'),
        });

        // Validate HTTP response status
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }

        const remoteData = await response.json();

        // Basic schema validation - ensure we got an array with content
        if (!Array.isArray(remoteData) || remoteData.length === 0) {
            throw new Error('Invalid adhkar data structure');
        }

        // Log summary stats for monitoring purposes
        logger.info('Loaded ' + remoteData.length + ' adhkar categories from new adhkar.json');
        let totalEntries = 0;
        remoteData.forEach((category) => {
            if (category.array && Array.isArray(category.array)) {
                totalEntries += category.array.length;
            }
        });
        logger.info('Total adhkar entries: ' + totalEntries);

        return remoteData;
    } catch (error) {
        // Graceful degradation - log warning and return safe fallback data
        logger.warn('Failed to load remote adhkar data from adhkar.json ' + error.message + ' using fallback data');

        // Minimal hardcoded dataset to keep the bot functional during outages
        return [
            {
                id: 1,
                category: 'تسبيح',
                audio: '/audio/ar_7esn_AlMoslem_by_Doors_028.mp3',
                filename: 'ar_7esn_AlMoslem_by_Doors_028',
                array: [
                    {
                        text: 'سبحان الله وبحمده',
                        count: 100,
                        audio: '/audio/91.mp3',
                        filename: '91',
                    },
                    {
                        text: 'الحمد لله',
                        count: 100,
                        audio: '/audio/92.mp3',
                        filename: '92',
                    },
                    {
                        text: 'الله أكبر',
                        count: 100,
                        audio: '/audio/93.mp3',
                        filename: '93',
                    },
                ],
            },
        ];
    }
}

module.exports.loadRemoteAzkarData = loadRemoteAzkarData;
