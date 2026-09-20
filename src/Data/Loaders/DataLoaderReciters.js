const logger = require('@infrastructure/Logging/Logger');
const { GLOBAL_CONSTANTS } = require('@data/Loaders/DataLoaderConstants');
const { getCachedRecitersData } = require('@data/Loaders/DataLoaderCache');
const { validateReciterData } = require('@data/Loaders/DataLoaderValidator');
const { formatReciterName, formatServerUrl, formatSurahUrl, formatDuration } = require('@data/Loaders/DataLoaderFormatter');

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
