require('pathlra-aliaser')();

const DEFAULT_USER_AGENT =
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const BOT_USER_AGENT = 'Mozilla/5.0 (compatible; QuranBot/0.7.29; +https://github.com/mgv-hub/quranbot)';

const AUDIO_ACCEPT_HEADER = 'audio/*, */*;q=0.8';
const JSON_ACCEPT_HEADER = 'application/json, text/plain, */*';
const HTML_ACCEPT_HEADER = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';

const REQUEST_TIMEOUT_MS = 15000;
const HEAD_REQUEST_TIMEOUT_MS = 8000;
const STREAM_TIMEOUT_MS = 30000;

function getBaseHeaders(options = {}) {
   const { userAgent = BOT_USER_AGENT, acceptType = 'audio', includeReferer = false, customHeaders = {} } = options;

   const headers = {
      'User-Agent': userAgent,
   };

   switch (acceptType) {
      case 'audio':
         headers['Accept'] = AUDIO_ACCEPT_HEADER;
         break;
      case 'json':
         headers['Accept'] = JSON_ACCEPT_HEADER;
         break;
      case 'html':
         headers['Accept'] = HTML_ACCEPT_HEADER;
         break;
      case 'none':
         break;
      default:
         headers['Accept'] = acceptType;
   }

   if (includeReferer) {
      headers['Referer'] = 'https://www.mp3quran.net/';
   }

   Object.assign(headers, customHeaders);

   return headers;
}

function getAudioStreamHeaders(customUserAgent) {
   return getBaseHeaders({
      userAgent: customUserAgent || BOT_USER_AGENT,
      acceptType: 'audio',
      includeReferer: true,
   });
}

function getApiHeaders() {
   return getBaseHeaders({
      userAgent: DEFAULT_USER_AGENT,
      acceptType: 'json',
   });
}

function getBrowserHeaders() {
   return getBaseHeaders({
      userAgent: DEFAULT_USER_AGENT,
      acceptType: 'html',
      includeReferer: false,
   });
}

function getTimeoutForRequest(type = 'default') {
   switch (type) {
      case 'head':
         return HEAD_REQUEST_TIMEOUT_MS;
      case 'stream':
         return STREAM_TIMEOUT_MS;
      default:
         return REQUEST_TIMEOUT_MS;
   }
}

module.exports.getBaseHeaders = getBaseHeaders;
module.exports.getAudioStreamHeaders = getAudioStreamHeaders;
module.exports.getApiHeaders = getApiHeaders;
module.exports.getBrowserHeaders = getBrowserHeaders;
module.exports.getTimeoutForRequest = getTimeoutForRequest;
module.exports.DEFAULT_USER_AGENT = DEFAULT_USER_AGENT;
module.exports.BOT_USER_AGENT = BOT_USER_AGENT;
module.exports.AUDIO_ACCEPT_HEADER = AUDIO_ACCEPT_HEADER;
module.exports.JSON_ACCEPT_HEADER = JSON_ACCEPT_HEADER;
module.exports.HTML_ACCEPT_HEADER = HTML_ACCEPT_HEADER;
module.exports.REQUEST_TIMEOUT_MS = REQUEST_TIMEOUT_MS;
module.exports.HEAD_REQUEST_TIMEOUT_MS = HEAD_REQUEST_TIMEOUT_MS;
module.exports.STREAM_TIMEOUT_MS = STREAM_TIMEOUT_MS;
