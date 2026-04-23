require('pathlra-aliaser')();

const fs = require('fs').promises;
const pathlra = require('path');
const logger = require('@logger');

async function saveDataLocally() {
   try {
      const dataDir = pathlra.join(__dirname, '..', 'data');
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(pathlra.join(dataDir, 'surah_names_ar.json'), JSON.stringify(global.surahNames, null, 2));
      await fs.writeFile(pathlra.join(dataDir, 'reciters_ar.json'), JSON.stringify(global.reciters, null, 2));
      await fs.writeFile(pathlra.join(dataDir, 'radios_ar.json'), JSON.stringify(global.quranRadios, null, 2));
      await fs.writeFile(pathlra.join(dataDir, 'adhkar_ar.json'), JSON.stringify(global.azkarData, null, 2));
      logger.info('Data saved locally');
      return true;
   } catch (error) {
      logger.error('Error saving data locally', error);
      return false;
   }
}

module.exports.saveDataLocally = saveDataLocally;
