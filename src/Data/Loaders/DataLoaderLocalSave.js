const fs = require('fs').promises;
const path = require('path');
const logger = require('@infrastructure/Logging/Logger');

// Persist global data objects to local JSON files for offline fallback
async function saveDataLocally() {
    try {
        const dataDirectory = path.join(__dirname, '..'); 
        await fs.mkdir(dataDirectory, { recursive: true });
        await fs.writeFile(path.join(dataDirectory, 'surah_names_ar.json'), JSON.stringify(global.surahNames, null, 2));
        await fs.writeFile(path.join(dataDirectory, 'reciters_ar.json'), JSON.stringify(global.reciters, null, 2));
        await fs.writeFile(path.join(dataDirectory, 'radios_ar.json'), JSON.stringify(global.quranRadios, null, 2));
        await fs.writeFile(path.join(dataDirectory, 'adhkar_ar.json'), JSON.stringify(global.azkarData, null, 2));
        logger.info('Data saved locally');
        return true;
    } catch (error) {
        logger.error('Error saving data locally', error);
        return false;
    }
}

module.exports.saveDataLocally = saveDataLocally;
