require('pathlra-aliaser')();

const fetch = require('node-fetch').default;
const logger = require('@logger');
const { getBrowserHeaders, getTimeoutForRequest } = require('@httpConfig-core_utils');

async function loadRemoteAzkarData() {
   try {
      const response = await fetch('https://hub-mgv.github.io/QuranBotData/adhkar.json', {
         headers: getBrowserHeaders(),
         timeout: getTimeoutForRequest('default'),
      });
      if (!response.ok) {
         throw new Error('HTTP ' + response.status);
      }
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
         throw new Error('Invalid adhkar data structure');
      }
      logger.info('Loaded ' + data.length + ' adhkar categories from new adhkar.json');
      let totalAdhkar = 0;
      data.forEach((cat) => {
         if (cat.array && Array.isArray(cat.array)) {
            totalAdhkar += cat.array.length;
         }
      });
      logger.info('Total adhkar entries: ' + totalAdhkar);
      return data;
   } catch (error) {
      logger.warn('Failed to load remote adhkar data from adhkar.json ' + error.message + ' using fallback data');
      return [
         {
            id: 1,
            category: 'تسبيح',
            audio: '/audio/ar_7esn_AlMoslem_by_Doors_028.mp3',
            filename: 'ar_7esn_AlMoslem_by_Doors_028',
            array: [
               {
                  text: 'سبحان الله وبحمده',
                  count: 100,
                  audio: '/audio/91.mp3',
                  filename: '91',
               },
               {
                  text: 'الحمد لله',
                  count: 100,
                  audio: '/audio/92.mp3',
                  filename: '92',
               },
               {
                  text: 'الله أكبر',
                  count: 100,
                  audio: '/audio/93.mp3',
                  filename: '93',
               },
            ],
         },
      ];
   }
}

module.exports.loadRemoteAzkarData = loadRemoteAzkarData;
