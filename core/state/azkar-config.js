require('pathlra-aliaser')();

const { TIME_CONSTANTS, URLs } = require('@configConstants-core_utils');

const ADHKAR_BASE_URL = URLs.ADHKAR_BASE_URL;
const ADHKAR_IMAGES_BASE_URL = URLs.ADHKAR_IMAGES_BASE_URL;
const AZKAR_EXPIRY_MS = TIME_CONSTANTS.AZKAR_EXPIRY_MS;
const AZKAR_INTERVAL_MS = TIME_CONSTANTS.AZKAR_INTERVAL_MS;
const AZKAR_MAX_RETRY_ATTEMPTS = TIME_CONSTANTS.AZKAR_MAX_RETRY_ATTEMPTS;
const AZKAR_RETRY_DELAY_MS = TIME_CONSTANTS.AZKAR_RETRY_DELAY_MS;
const REQUEST_TIMEOUT_MS = TIME_CONSTANTS.REQUEST_TIMEOUT_MS;

const FALLBACK_AZKAR_DATA = [
   {
      id: 1,
      category: 'تسبيح',
      audio: '/audio/ar_7esn_AlMoslem_by_Doors_028.mp3',
      filename: 'ar_7esn_AlMoslem_by_Doors_028',
      array: [
         {
            id: 1,
            text: 'سبحان الله وبحمده',
            count: 100,
            audio: '/audio/91.mp3',
            filename: '91',
         },
      ],
   },
];

module.exports.ADHKAR_BASE_URL = ADHKAR_BASE_URL;
module.exports.ADHKAR_IMAGES_BASE_URL = ADHKAR_IMAGES_BASE_URL;
module.exports.AZKAR_EXPIRY_MS = AZKAR_EXPIRY_MS;
module.exports.AZKAR_INTERVAL_MS = AZKAR_INTERVAL_MS;
module.exports.AZKAR_MAX_RETRY_ATTEMPTS = AZKAR_MAX_RETRY_ATTEMPTS;
module.exports.AZKAR_RETRY_DELAY_MS = AZKAR_RETRY_DELAY_MS;
module.exports.REQUEST_TIMEOUT_MS = REQUEST_TIMEOUT_MS;
module.exports.FALLBACK_AZKAR_DATA = FALLBACK_AZKAR_DATA;
