require('pathlra-aliaser')();

const logger = require('@logger');
const { AZKAR_IMAGE_URLS } = require('@data-loader-constants-core_data');

async function loadAzkarImages() {
   global.azkarImages = AZKAR_IMAGE_URLS;
   logger.info(`Loaded ${global.azkarImages.length} azkar image URLs`);
   return true;
}

module.exports.loadAzkarImages = loadAzkarImages;
