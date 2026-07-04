const path = require('path');

// Base CDN path for Quran data resources
const DATA_CDN_BASE = 'https://hub-mgv.github.io/QuranBotData/quran/';

// Local path for caching data endpoint mappings
const cacheFilePath = path.join(__dirname, '../../storage/database/data_url.json');

// List of reciter metadata JSON endpoints to preload
const reciter_endpoints = [
    `${DATA_CDN_BASE}Al_Ashri_Omran.json`,
    `${DATA_CDN_BASE}Al_Ayun_Al_Koshi.json`,
    `${DATA_CDN_BASE}Al_Fateh_Mohammad_Al_Zubair.json`,
    `${DATA_CDN_BASE}badr_al_turki.json`,
    `${DATA_CDN_BASE}bandar_balilah.json`,
    `${DATA_CDN_BASE}jamaan_alosaimi.json`,
    `${DATA_CDN_BASE}jamal_shaker_abdullah.json`,
    `${DATA_CDN_BASE}junaid_adam_abdullah.json`,
    `${DATA_CDN_BASE}peshawa_qadir_quran.json`,
    `${DATA_CDN_BASE}tawfiq_al_sayegh.json`,
    `${DATA_CDN_BASE}Yasin_Qari.json`,
    `${DATA_CDN_BASE}Zain_Mohammad_Ahmed.json`,
    `${DATA_CDN_BASE}ahmad_al_hawashi.json`,
    `${DATA_CDN_BASE}ahmad_al_hudhayfi.json`,
    `${DATA_CDN_BASE}ahmad_al_suwaylim.json`,
    `${DATA_CDN_BASE}ahmad_al_tarabulsi.json`,
];

// Supported language configurations with associated API endpoints
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
module.exports.RECITER_URLS = reciter_endpoints;
