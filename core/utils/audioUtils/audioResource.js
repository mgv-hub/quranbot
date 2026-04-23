require('pathlra-aliaser');
const { createAudioResource, StreamType } = require('@discordjs/voice');
const fetch = require('node-fetch').default;
const logger = require('../logger');
const { AbortController } = require('abort-controller');
const { getAudioStreamHeaders, getTimeoutForRequest } = require('../httpConfig');
const { VOICE_CONFIG } = require('../configConstants');

const DEFAULT_VOLUME = VOICE_CONFIG.DEFAULT_VOLUME || 0.5;
const MAX_RETRY_ATTEMPTS = 7;
const STREAM_TIMEOUT_MS = getTimeoutForRequest('stream');

async function fetchWithRetry(url, options = {}, maxRetries = MAX_RETRY_ATTEMPTS) {
   let lastError = null;
   for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let timeoutId = null;
      try {
         const controller = new AbortController();
         const timeoutMs = options.timeout || STREAM_TIMEOUT_MS;
         timeoutId = setTimeout(() => controller.abort(), timeoutMs);
         const headers = options.headers || getAudioStreamHeaders();
         const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers,
         });
         if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
         }
         return response;
      } catch (error) {
         lastError = error;
         logger.warn(`Retry ${attempt} for ${url} - Error: ${error.message}`);
         if (error.message.includes('EAGAIN') || error.message.includes('resource')) {
            const retrv_d_ms = 2000;
            const baseDelay = retrv_d_ms * attempt * 3;
            const jitter = Math.random() * 1000;
            await delay(baseDelay + jitter);
         } else if (attempt < maxRetries) {
            const baseDelay = retrv_d_ms * attempt;
            const jitter = Math.random() * 500;
            await delay(baseDelay + jitter);
         }
      } finally {
         if (timeoutId) {
            clearTimeout(timeoutId);
         }
      }
   }
   throw lastError || new Error('All retry attempts failed');
}

async function createAudioStreamResource(url, startSeconds = 0) {
   if (!url || !url.startsWith('http')) {
      throw new Error(`Invalid URL: ${url}`);
   }
   const headers = getAudioStreamHeaders();
   if (startSeconds > 0) {
      const byteOffset = await calculateByteRange(url, startSeconds, headers);
      headers['Range'] = `bytes=${byteOffset}-`;
   }
   const response = await fetchWithRetry(url, { headers });
   const contentType = response.headers.get('content-type');
   if (!contentType || !contentType.includes('audio')) {
      throw new Error(`Unexpected content type: ${contentType}`);
   }
   const resource = createAudioResource(response.body, {
      inputType: StreamType.Arbitrary,
      inlineVolume: true,
      volume: DEFAULT_VOLUME,
   });
   return resource;
}

async function calculateByteRange(url, startSeconds, headers) {
   if (startSeconds <= 0) {
      return 0;
   }
   try {
      const headResponse = await fetch(url, {
         method: 'HEAD',
         signal: new AbortController().signal,
         headers: {
            ...headers,
            Range: 'bytes=0-1',
         },
      });
      const contentRange = headResponse.headers.get('content-range');
      const contentLength = headResponse.headers.get('content-length');
      if (contentRange) {
         const match = contentRange.match(/\/(\d+)$/);
         if (match) {
            const totalBytes = parseInt(match[1], 10);
            const durationMs = await getAudioDuration(url, headResponse);
            const bytesPerSecond = totalBytes / (durationMs / 1000);
            return Math.floor(startSeconds * bytesPerSecond);
         }
      }
      if (contentLength) {
         const durationMs = await getAudioDuration(url, headResponse);
         const bytesPerSecond = parseInt(contentLength, 10) / (durationMs / 1000);
         return Math.floor(startSeconds * bytesPerSecond);
      }
      const DEFAULT_BITRATE_KBPS = 128;
      const BYTES_PER_SECOND = (DEFAULT_BITRATE_KBPS * 1024) / 8;
      return Math.floor(startSeconds * BYTES_PER_SECOND);
   } catch (error) {
      logger.debug('Range calculation failed, using default');
      const DEFAULT_BITRATE_KBPS = 128;
      const BYTES_PER_SECOND = (DEFAULT_BITRATE_KBPS * 1024) / 8;
      return Math.floor(startSeconds * BYTES_PER_SECOND);
   }
}

async function getAudioDuration(url, headResponse = null) {
   const cacheKey = `duration_${url}`;
   if (global.durationCache && global.durationCache.has(cacheKey)) {
      return global.durationCache.get(cacheKey);
   }
   try {
      const response =
         headResponse ||
         (await fetch(url, {
            method: 'HEAD',
            signal: new AbortController().signal,
            headers: getAudioStreamHeaders(),
         }));
      const durationHeader =
         response.headers.get('x-duration-ms') ||
         response.headers.get('x-content-duration') ||
         response.headers.get('content-duration');
      if (durationHeader) {
         const duration = parseInt(durationHeader, 10);
         if (duration > 0 && duration < 7200000) {
            if (global.durationCache) {
               global.durationCache.set(cacheKey, duration);
            }
            return duration;
         }
      }
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
         const DEFAULT_BITRATE_KBPS = 128;
         const estimatedDuration = ((parseInt(contentLength, 10) * 8) / (DEFAULT_BITRATE_KBPS * 1024)) * 1000;
         if (estimatedDuration > 0 && estimatedDuration < 7200000) {
            if (global.durationCache) {
               global.durationCache.set(cacheKey, estimatedDuration);
            }
            return estimatedDuration;
         }
      }
      const surahNumber = extractSurahNumberFromUrl(url);
      if (surahNumber > 0 && surahNumber <= 114) {
         const estimatedDuration = 60000 + surahNumber * 30000;
         if (global.durationCache) {
            global.durationCache.set(cacheKey, estimatedDuration);
         }
         return estimatedDuration;
      }
      return 180000;
   } catch (error) {
      return 180000;
   }
}

function extractSurahNumberFromUrl(url) {
   const match = url.match(/\/(\d{1,3})\.mp3$/);
   if (match) {
      return parseInt(match[1], 10);
   }
   const match2 = url.match(/(\d{1,3})\.mp3$/);
   if (match2) {
      return parseInt(match2[1], 10);
   }
   return 0;
}

function delay(ms) {
   return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports.createAudioStreamResource = createAudioStreamResource;
module.exports.fetchWithRetry = fetchWithRetry;
module.exports.calculateByteRange = calculateByteRange;
module.exports.getAudioDuration = getAudioDuration;
module.exports.extractSurahNumberFromUrl = extractSurahNumberFromUrl;
