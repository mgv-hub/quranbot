const logger = require('@logging/logger');
const { GLOBAL_CONSTANTS } = require('@data/data-loader-constants');
const { getCachedRecitersData } = require('@data-loader-cache-core_data');
const { validateReciterData } = require('@data-loader-validator-core_data');
const { formatReciterName, formatServerUrl, formatSurahUrl, formatDuration } = require('@data-loader-formatter-core_data');

async function loadReciters() {
    try {
        const cached = await getCachedRecitersData();
        global.reciters = {};
        const recitersArray = Array.isArray(cached) ? cached : cached?.reciters || [];
        for (const reciter of recitersArray) {
            if (validateReciterData(reciter)) {
                const baseUrl = formatServerUrl(reciter.server);
                const reciterKey = `reciter_${reciter.id}`;
                const audioLinks = [];
                const durationList = [];
                // Generate MP3 URLs and estimated durations for all 114 surahs
                for (let surahNum = 1; surahNum <= GLOBAL_CONSTANTS.total_surahs; surahNum++) {
                    const surahLink = formatSurahUrl(baseUrl, surahNum, reciter.rewaya_id);
                    audioLinks.push(surahLink.trim());
                    const estimatedDuration = formatDuration(surahNum);
                    durationList.push(estimatedDuration);
                }

                global.reciters[reciterKey] = {
                    // Use reciterKey for consistent access pattern
                    id: reciter.id,
                    name: formatReciterName(reciter.name),
                    rewaya: reciter.rewaya_id,
                    photo: reciter.photo || '',
                    links: audioLinks,
                    durations: durationList,
                };
            }
        }
        if (Object.keys(global.reciters).length === 0) {
            logger.warn('No reciters loaded Using empty reciters object');
        }
        logger.info(`Loaded ${Object.keys(global.reciters).length} reciters`);
        return true;
    } catch (error) {
        logger.error('Error loading reciters', error);
        global.reciters = {};
        return true;
    }
}
module.exports.loadReciters = loadReciters;
