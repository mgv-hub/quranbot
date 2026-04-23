require('pathlra-aliaser')();
const base = 'https://hub-mgv.github.io/QuranBotData/quran/';

const path = require('path');

const cacheFilePath = path.join(__dirname, '../../storage/database/data_url.json');

const RECITER_URLS = [
   `${base}Al_Ashri_Omran.json`,
   `${base}Al_Ayun_Al_Koshi.json`,
   `${base}Al_Fateh_Mohammad_Al_Zubair.json`,
   `${base}badr_al_turki.json`,
   `${base}bandar_balilah.json`,
   `${base}jamaan_alosaimi.json`,
   `${base}jamal_shaker_abdullah.json`,
   `${base}junaid_adam_abdullah.json`,
   `${base}peshawa_qadir_quran.json`,
   `${base}tawfiq_al_sayegh.json`,
   `${base}Yasin_Qari.json`,
   `${base}Zain_Mohammad_Ahmed.json`,
   `${base}ahmad_al_hawashi.json`,
   `${base}ahmad_al_hudhayfi.json`,
   `${base}ahmad_al_suwaylim.json`,
   `${base}ahmad_al_tarabulsi.json`,
];

global.languages = [
   {
      id: '1',
      language: 'Arabic',
      native: 'العربية',
      surah: 'https://www.mp3quran.net/api/v3/suwar?language=ar',
      rewayah: 'https://www.mp3quran.net/api/v3/riwayat?language=ar',
      moshaf: 'https://www.mp3quran.net/api/v3/moshaf?language=ar',
      reciters: 'https://www.mp3quran.net/api/v3/reciters?language=ar',
      radios: 'https://www.mp3quran.net/api/v3/radios?language=ar',
      tafasir: 'https://www.mp3quran.net/api/v3/tafasir?language=ar',
   },
];

module.exports.cacheFilePath = cacheFilePath;
module.exports.RECITER_URLS = RECITER_URLS;
