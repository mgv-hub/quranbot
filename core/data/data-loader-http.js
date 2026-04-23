require('pathlra-aliaser')();

const fetch = require('node-fetch').default;
const logger = require('@logger');
const { getBrowserHeaders, getTimeoutForRequest } = require('@httpConfig-core_utils');
const { getAdhkarUrl } = require('@data-loader-config-core_data');

async function fetchAdhkarData() {
   try {
      const url = getAdhkarUrl();
      const response = await fetch(url, {
         headers: getBrowserHeaders(),
         timeout: getTimeoutForRequest('default'),
      });
      if (!response.ok) {
         throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return data;
   } catch (error) {
      logger.error('Error fetching adhkar data', error);
      throw error;
   }
}

module.exports.fetchAdhkarData = fetchAdhkarData;
