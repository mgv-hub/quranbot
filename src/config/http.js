const { urls, voice_config, time_constants } = require('@config/constants');

const default_user_agent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const bot_user_agent = 'Mozilla/5.0 (compatible; QuranBot/0.7.29; +https://github.com/mgv-hub/quranbot)';

const audio_accept_header = 'audio/*, */*;q=0.8';
const json_accept_header = 'application/json, text/plain, */*';
const html_accept_header = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';

const request_timeout_ms = time_constants.request_timeout_ms;
const head_request_timeout_ms = time_constants.head_request_timeout_ms;
const stream_timeout_ms = time_constants.stream_timeout_ms;

function getBaseHeaders(options = {}) {
    const { userAgent = bot_user_agent, acceptType = 'audio', includeReferer = false, customHeaders = {} } = options;

    const headers = {
        'User-Agent': userAgent,
    };

    switch (acceptType) {
        case 'audio':
            headers['Accept'] = audio_accept_header;
            break;
        case 'json':
            headers['Accept'] = json_accept_header;
            break;
        case 'html':
            headers['Accept'] = html_accept_header;
            break;
        case 'none':
            break;
        default:
            headers['Accept'] = acceptType;
    }

    // mp3quran.net blocks requests without referer from certain endpoints
    if (includeReferer) {
        headers['Referer'] = 'https://www.mp3quran.net/';
    }

    Object.assign(headers, customHeaders);

    return headers;
}

function getAudioStreamHeaders(customUserAgent) {
    return getBaseHeaders({
        userAgent: customUserAgent || bot_user_agent,
        acceptType: 'audio',
        includeReferer: true,
    });
}

function getApiHeaders() {
    return getBaseHeaders({
        userAgent: bot_user_agent,
        acceptType: 'json',
    });
}

function getBrowserHeaders() {
    return getBaseHeaders({
        userAgent: default_user_agent,
        acceptType: 'html',
        includeReferer: false,
    });
}

function TimeoutRequest(type = 'default') {
    switch (type) {
        case 'head':
            return head_request_timeout_ms;
        case 'stream':
            return stream_timeout_ms;
        default:
            return request_timeout_ms;
    }
}

module.exports.getBaseHeaders = getBaseHeaders;
module.exports.getAudioStreamHeaders = getAudioStreamHeaders;
module.exports.getApiHeaders = getApiHeaders;
module.exports.getBrowserHeaders = getBrowserHeaders;
module.exports.TimeoutRequest = TimeoutRequest;
module.exports.default_user_agent = default_user_agent;
module.exports.bot_user_agent = bot_user_agent;
module.exports.audio_accept_header = audio_accept_header;
module.exports.json_accept_header = json_accept_header;
module.exports.html_accept_header = html_accept_header;
module.exports.request_timeout_ms = request_timeout_ms;
module.exports.head_request_timeout_ms = head_request_timeout_ms;
module.exports.stream_timeout_ms = stream_timeout_ms;
