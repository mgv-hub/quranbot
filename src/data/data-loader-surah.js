const logger = require('@logging/logger');
const { GLOBAL_CONSTANTS } = require('@data/data-loader-constants');
const { getCachedSurahData } = require('@data-loader-cache-core_data');
const { validateSurahList, normalizeSurahCount } = require('@data-loader-validator-core_data');

async function loadSurahNames() {
    try {
        const cached = await getCachedSurahData();
        // Handle both old structure { suwar: [...] } and new structure [...]
        const suwarArray = Array.isArray(cached) ? cached : cached?.suwar || [];
        // Filter and sort surahs to ensure we have exactly 114 valid entries in order
        const validSurahs = suwarArray
            .filter((surah) => surah.id >= 1 && surah.id <= GLOBAL_CONSTANTS.total_surahs)
            .sort((a, b) => a.id - b.id);
        // If we don't have the full set, fall back to generated default names
        if (validSurahs.length !== GLOBAL_CONSTANTS.total_surahs) {
            logger.warn(`${validSurahs.length} Surah loaded instead of ${GLOBAL_CONSTANTS.total_surahs} Using default names`);
            global.surahNames = Array.from(
                { length: GLOBAL_CONSTANTS.total_surahs },
                (_, index) => `${GLOBAL_CONSTANTS.DEFAULT_SURAH_NAME_PREFIX}${index + 1}`,
            );
        } else {
            // Extract just the name field from each validated surah entry
            global.surahNames = validSurahs.map((surah) => surah.name);
        }
        logger.info(`Loaded ${global.surahNames.length} surah names`);
        return true;
    } catch (error) {
        logger.error('Error loading surah names', error);
        // Fallback to generated names if cache read fails entirely
        global.surahNames = Array.from(
            { length: GLOBAL_CONSTANTS.total_surahs },
            (_, index) => `${GLOBAL_CONSTANTS.DEFAULT_SURAH_NAME_PREFIX}${index + 1}`,
        );
        return true;
    }
}

module.exports.loadSurahNames = loadSurahNames;
