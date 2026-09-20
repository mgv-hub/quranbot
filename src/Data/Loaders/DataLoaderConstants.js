// Base CDN path for azkar image assets
const azkar_images_base = 'https://hub-mgv.github.io/QuranBotData/azkar-images/';

// Core application constants used across data loading and playback logic
const GLOBAL_CONSTANTS = {
    total_surahs: 114,
    DEFAULT_SURAH_NAME_PREFIX: 'سورة ',
    BASE_DURATION_MS: 60000,
    DURATION_MULTIPLIER: 0.01,
    ADHKAR_FALLBACK_ID: 1,
    ADHKAR_FALLBACK_CATEGORY: 'تسبيح',
    AZKAR_IMAGES_COUNT: 15,
};

// Fallback adhkar dataset used when remote fetch fails
const _adhkar_fallback_data_ = [
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

// Predefined list of azkar image URLs for display in commands
const azkar_image_urls = [
    `${azkar_images_base}1%20(1).png`,
    `${azkar_images_base}1%20(3).png`,
    `${azkar_images_base}1%20(4).png`,
    `${azkar_images_base}1%20(5).png`,
    `${azkar_images_base}1%20(6).png`,
    `${azkar_images_base}1%20(7).png`,
    `${azkar_images_base}1%20(8).png`,
    `${azkar_images_base}1%20(9).png`,
    `${azkar_images_base}1%20(10).png`,
    `${azkar_images_base}1%20(11).png`,
    `${azkar_images_base}1%20(12).png`,
    `${azkar_images_base}1%20(13).png`,
    `${azkar_images_base}1%20(14).png`,
    `${azkar_images_base}1%20(15).png`,
    `${azkar_images_base}1%20(16).png`,
];

module.exports.GLOBAL_CONSTANTS = GLOBAL_CONSTANTS;
module.exports._adhkar_fallback_data_ = _adhkar_fallback_data_;
module.exports.azkar_image_urls = azkar_image_urls;
