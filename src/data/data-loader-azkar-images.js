const logger = require('@logging/logger');
const { azkar_image_urls } = require('@data/data-loader-constants');

// Initialize azkar image URLs in global state for easy access across modules
async function loadAzkarImages() {
    global.azkarImages = azkar_image_urls;
    logger.info(`Loaded ${global.azkarImages.length} azkar image URLs`);
    return true;
}

module.exports.loadAzkarImages = loadAzkarImages;
