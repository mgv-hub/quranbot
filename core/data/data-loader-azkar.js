require('pathlra-aliaser')();

const logger = require('@logger');
const { fetchAdhkarData } = require('@data-loader-http-core_data');
const { validateAdhkarData } = require('@data-loader-validator-core_data');
const { ADHKAR_FALLBACK_DATA } = require('@data-loader-constants-core_data');

async function loadAzkarData() {
   try {
      const data = await fetchAdhkarData();
      if (!validateAdhkarData(data)) {
         throw new Error('Invalid adhkar data structure');
      }
      global.azkarData = data;
      logger.info(`Loaded ${data.length} adhkar categories from new system`);
      let totalAdhkar = 0;
      data.forEach((cat) => {
         if (cat.array && Array.isArray(cat.array)) {
            totalAdhkar += cat.array.length;
         }
      });
      logger.info(`Total adhkar entries: ${totalAdhkar}`);
      return true;
   } catch (error) {
      logger.warn('Failed to load new adhkar data from adhkar.json ' + error.message + ' using fallback data');
      global.azkarData = ADHKAR_FALLBACK_DATA;
      return true;
   }
}

module.exports.loadAzkarData = loadAzkarData;
