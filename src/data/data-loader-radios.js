const logger = require('@logging/logger');
const { getCachedRadiosData } = require('@data-loader-cache-core_data');
const { validateRadioData, formatRadioUrl } = require('@data-loader-validator-core_data');

async function loadQuranRadios() {
    try {
        const cached = await getCachedRadiosData();
        let radiosArray = [];
        if (cached && typeof cached === 'object') {
            if (Array.isArray(cached.radios)) {
                radiosArray = cached.radios;
            } else if (cached.radios && Array.isArray(cached.radios.radios)) {
                radiosArray = cached.radios.radios;
            } else if (Array.isArray(cached)) {
                // Direct array structure
                radiosArray = cached;
            }
        }
        global.quranRadios = radiosArray
            .map((radio) => ({
                name: radio.name,
                url: formatRadioUrl(radio.url),
            }))
            .filter((radio) => validateRadioData(radio));
        if (global.quranRadios.length === 0) {
            logger.warn('No radios loaded from cache');
        }
        logger.info(`Loaded ${global.quranRadios.length} radio stations`);
        return true;
    } catch (error) {
        logger.error('Error loading Quran radios', error);
        // Ensure global state is initialized even on failure
        global.quranRadios = [];
        return true;
    }
}

module.exports.loadQuranRadios = loadQuranRadios;
