const fs = require('fs').promises;
const path = require('path');
const logger = require('@logging/logger');

// Load Quran-related data from local JSON files with graceful fallbacks
async function loadDataFromLocal() {
    try {
        const dataDirectory = path.join(__dirname, '..', 'data');
        let allFilesLoaded = true;

        // Attempt to load surah names
        try {
            const surahNamesRaw = await fs.readFile(path.join(dataDirectory, 'surah_names_ar.json'), 'utf8');
            global.surahNames = JSON.parse(surahNamesRaw);
            logger.info(`Loaded ${global.surahNames.length} surah names from local file`);
        } catch (err) {
            logger.warn('No local surah name file found will load from cache');
            allFilesLoaded = false;
        }

        // Attempt to load reciter metadata
        try {
            const recitersRaw = await fs.readFile(path.join(dataDirectory, 'reciters_ar.json'), 'utf8');
            global.reciters = JSON.parse(recitersRaw);
            logger.info(`Loaded ${Object.keys(global.reciters).length} reciters from local file`);
        } catch (err) {
            logger.warn('No local reader file found will load from cache');
            allFilesLoaded = false;
        }

        // Attempt to load radio station list
        try {
            const radiosRaw = await fs.readFile(path.join(dataDirectory, 'radios_ar.json'), 'utf8');
            global.quranRadios = JSON.parse(radiosRaw);
            logger.info(`Loaded ${global.quranRadios.length} radio stations from local file`);
        } catch (err) {
            logger.warn('No local radio file found will load from cache');
            allFilesLoaded = false;
        }

        // Attempt to load adhkar data
        try {
            const adhkarRaw = await fs.readFile(path.join(dataDirectory, 'adhkar_ar.json'), 'utf8');
            global.azkarData = JSON.parse(adhkarRaw);
            logger.info(`Loaded ${global.azkarData.length} adhkar categories from local file`);
        } catch (err) {
            logger.warn('No local adhkar file found will load from remote');
            allFilesLoaded = false;
        }

        return allFilesLoaded;
    } catch (error) {
        logger.error('Error loading data from local files', error);
        return false;
    }
}

module.exports.loadDataFromLocal = loadDataFromLocal;
