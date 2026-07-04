const { urls } = require('@config/constants');

function initializeGlobalLanguages() {
    global.languages = [
        {
            id: '1',
            language: 'Arabic',
            native: 'العربية',
            ...urls.api_endpoints,
        },
    ];
    return global.languages;
}

// Return the list of reciter metadata endpoint urls
function getReciterUrls() {
    return urls.reciter_urls;
}

// Return the canonical URL for fetching adhkar data
function getAdhkarUrl() {
    return 'https://hub-mgv.github.io/QuranBotData/adhkar.json';
}

module.exports.initializeGlobalLanguages = initializeGlobalLanguages;
module.exports.getReciterUrls = getReciterUrls;
module.exports.getAdhkarUrl = getAdhkarUrl;
