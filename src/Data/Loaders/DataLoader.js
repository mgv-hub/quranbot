const logger = require('@infrastructure/Logging/Logger');
const { initializeGlobalLanguages } = require('@data/Loaders/DataLoaderConfig');
const { loadSurahNames } = require('@data/Loaders/DataLoaderSurah');
const { loadReciters } = require('@data/Loaders/DataLoaderReciters');
const { loadQuranRadios } = require('@data-loader-radios-core_data');
const { loadAzkarData } = require('@data/Loaders/DataLoaderAzkar');
const { loadAzkarImages } = require('@data/Loaders/DataLoaderAzkarImages');
const { normalizeSurahCount } = require('@data/Loaders/DataLoaderValidator');
const { GLOBAL_CONSTANTS } = require('@data/Loaders/DataLoaderConstants');

async function loadAllData() {
    try {
        initializeGlobalLanguages();
        await loadSurahNames();
        await loadReciters();
        await loadQuranRadios();
        await loadAzkarData();
        await loadAzkarImages();

        global.surahNames = normalizeSurahCount(global.surahNames);
        logger.info(
            `All data loaded: ${global.surahNames?.length || 0} surahs, ${
                Object.keys(global.reciters || {}).length
            } reciters, ${global.quranRadios?.length || 0} radios, ${
                global.azkarData?.length || 0
            } adhkar categories, ${global.azkarImages?.length || 0} images`,
        );
        return true;
    } catch (error) {
        logger.error('Error loading all data', error);
        // Initialize all global data structures with safe defaults on failure

        global.surahNames = Array.from(
            { length: GLOBAL_CONSTANTS.total_surahs },
            (_, i) => `${GLOBAL_CONSTANTS.DEFAULT_SURAH_NAME_PREFIX}${i + 1}`,
        );

        global.reciters = {};
        global.quranRadios = [];
        global.azkarData = [];
        return true;
    }
}

module.exports.loadAllData = loadAllData;
module.exports.loadSurahNames = loadSurahNames;
module.exports.loadReciters = loadReciters;
module.exports.loadQuranRadios = loadQuranRadios;
module.exports.loadAzkarData = loadAzkarData;
module.exports.loadAzkarImages = loadAzkarImages;
