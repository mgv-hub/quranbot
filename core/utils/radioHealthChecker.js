require('pathlra-aliaser')();

const logger = require('@logger');
const fetch = require('node-fetch').default;
const { AbortController } = require('abort-controller');
const { TIME_CONSTANTS } = require('@configConstants-core_utils');

if (!global.activeRadios) global.activeRadios = [];
if (!global.radioHealthStatus) global.radioHealthStatus = {};
if (!global.radioCheckInProgress) global.radioCheckInProgress = false;

const RADIO_CHECK_TIMEOUT_MS = TIME_CONSTANTS.RADIO_CHECK_TIMEOUT_MS;
const RADIO_CHECK_INTERVAL_MS = TIME_CONSTANTS.RADIO_CHECK_INTERVAL_MS;
const MIN_UPTIME_MS = TIME_CONSTANTS.MIN_UPTIME_MS;
const RADIO_BATCH_SIZE = TIME_CONSTANTS.RADIO_BATCH_SIZE;
const DELAY_BETWEEN_BATCHES_MS = TIME_CONSTANTS.DELAY_BETWEEN_BATCHES_MS;

async function checkRadio(u) {
   if (!u || typeof u !== 'string' || !u.trim()) return false;
   try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), RADIO_CHECK_TIMEOUT_MS);
      const res = await fetch(u, {
         method: 'HEAD',
         signal: ctrl.signal,
         headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; QuranBot',
            Accept: 'audio/*, */*',
         },
         redirect: 'follow',
      });
      clearTimeout(t);
      if (!res.ok) return false;
      const ct = res.headers.get('content-type');
      return ct && (ct.includes('audio') || ct.includes('stream'));
   } catch (e) {
      return false;
   }
}

async function checkAllRadios(force = false) {
   if (global.radioCheckInProgress && !force) {
      logger.debug('Radio Health Check Already In Progress Skipping');
      return;
   }

   if (!global.quranRadios || global.quranRadios.length === 0) {
      logger.warn('Radio Health No Radios Have Been Loaded Skipping Check');
      return;
   }

   global.radioCheckInProgress = true;

   try {
      const radios = global.quranRadios || [];
      const newStatus = {};
      let activeCount = 0;
      let changedCount = 0;

      for (let i = 0; i < radios.length; i += RADIO_BATCH_SIZE) {
         const batch = radios.slice(i, i + RADIO_BATCH_SIZE);
         const promises = batch.map((radio) => checkRadio(radio.url));
         const results = await Promise.allSettled(promises);

         results.forEach((result, idx) => {
            const radio = batch[idx];
            const wasActive = global.radioHealthStatus[radio.url]?.active;
            const isActive = result.status === 'fulfilled' && result.value;
            newStatus[radio.url] = {
               active: isActive,
               checkedAt: new Date().toISOString(),
               uptime: isActive ? new Date() - new Date(global.radioHealthStatus[radio.url]?.checkedAt || 0) : 0,
               firstChecked: global.radioHealthStatus[radio.url]?.firstChecked || new Date().toISOString(),
            };

            if (isActive && newStatus[radio.url].uptime >= MIN_UPTIME_MS) {
               activeCount++;
            }

            if (wasActive !== isActive) {
               changedCount++;
            }
         });

         if (i + RADIO_BATCH_SIZE < radios.length) {
            await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
         }
      }

      global.radioHealthStatus = newStatus;
      global.activeRadios = radios.filter((r) => newStatus[r.url]?.active && newStatus[r.url].uptime >= MIN_UPTIME_MS);

      logger.info(
         'Radio Health Check Complete Active ' + activeCount + ' Total ' + radios.length + ' Changed ' + changedCount,
      );
   } catch (error) {
      logger.error('Radio Health Check Failed ' + error.message);
   } finally {
      global.radioCheckInProgress = false;
   }
}

function getActiveRadioUrl(fallbackUrl) {
   if (fallbackUrl && global.radioHealthStatus[fallbackUrl]?.active) {
      return fallbackUrl;
   }

   const firstActive = global.activeRadios[0]?.url;
   if (firstActive) {
      return firstActive;
   }

   if (global.quranRadios && global.quranRadios.length > 0) {
      return global.quranRadios[0].url;
   }

   return null;
}

(async () => {
   setTimeout(() => {
      checkAllRadios().catch((err) => logger.error('Initial Radio Check Failed ' + err.message));
   }, 10000);

   setInterval(() => {
      checkAllRadios().catch((err) => logger.error('Periodic Radio Check Failed ' + err.message));
   }, RADIO_CHECK_INTERVAL_MS);

   try {
      const http = require('http');
      const server = http.createServer((req, res) => {
         if (req.url === '/radio-health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
               JSON.stringify({
                  status: 'ok',
                  activeRadios: global.activeRadios.length,
                  totalRadios: global.quranRadios?.length || 0,
                  lastCheck: new Date().toISOString(),
                  checkInProgress: global.radioCheckInProgress,
               }),
            );
         } else {
            res.writeHead(404);
            res.end();
         }
      });

      const port = process.env.HH_CH_PORT;
      server.listen(port, () => {
         logger.info('Radio Health Check Server Running On Port ' + port);
      });
   } catch (error) {
      logger.warn('Radio Health HTTP Server Failed To Start ' + error.message);
   }

   logger.info('Radio Health Checker Initialized Successfully');
})();

const exported = {
   checkAllRadios,
   getActiveRadioUrl,
   forceCheck: () => checkAllRadios(true),
};

global.radioHealthChecker = exported;
module.exports = exported;
