require('pathlra-aliaser')();
const base = 'https://hub-mgv.github.io/QuranBotData/azkar-images/';

const GLOBAL_CONSTANTS = {
   TOTAL_SURAHS: 114,
   DEFAULT_SURAH_NAME_PREFIX: 'سورة ',
   BASE_DURATION_MS: 60000,
   DURATION_MULTIPLIER: 0.01,
   ADHKAR_FALLBACK_ID: 1,
   ADHKAR_FALLBACK_CATEGORY: 'تسبيح',
   AZKAR_IMAGES_COUNT: 15,
};

const ADHKAR_FALLBACK_DATA = [
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
         {
            id: 2,
            text: 'الحمد لله',
            count: 100,
            audio: '/audio/92.mp3',
            filename: '92',
         },
         {
            id: 3,
            text: 'الله أكبر',
            count: 100,
            audio: '/audio/93.mp3',
            filename: '93',
         },
      ],
   },
];

const AZKAR_IMAGE_URLS = [
   `${base}1%20(1).png`,
   `${base}1%20(3).png`,
   `${base}1%20(4).png`,
   `${base}1%20(5).png`,
   `${base}1%20(6).png`,
   `${base}1%20(7).png`,
   `${base}1%20(8).png`,
   `${base}1%20(9).png`,
   `${base}1%20(10).png`,
   `${base}1%20(11).png`,
   `${base}1%20(12).png`,
   `${base}1%20(13).png`,
   `${base}1%20(14).png`,
   `${base}1%20(15).png`,
   `${base}1%20(16).png`,
];

module.exports.GLOBAL_CONSTANTS = GLOBAL_CONSTANTS;
module.exports.ADHKAR_FALLBACK_DATA = ADHKAR_FALLBACK_DATA;
module.exports.AZKAR_IMAGE_URLS = AZKAR_IMAGE_URLS;
