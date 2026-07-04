const logger = require('@logging/logger');
const { initializeGlobalLanguages } = require('@data-loader-config-core_data');
const { loadSurahNames } = require('@data-loader-surah-core_data');
const { loadReciters } = require('@data-loader-reciters-core_data');
const { loadQuranRadios } = require('@data-loader-radios-core_data');
const { loadAzkarData } = require('@data-loader-azkar-core_data');
const { loadAzkarImages } = require('@data-loader-azkar-images-core_data');
const { normalizeSurahCount } = require('@data-loader-validator-core_data');
const { GLOBAL_CONSTANTS } = require('@data/data-loader-constants');

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
