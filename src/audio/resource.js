const fetch = require('node-fetch').default;
const { getGuildStateById } = require('../state/guild-state-store');
const logger = require('@logging/logger');
const voiceLogger = require('@logging/voiceLogger');
const { getBestNode } = require('@startup/botSetup');

function getReciterLinks(state) {
    const reciterData = global.reciters?.[state.currentReciter];
    if (!reciterData?.links) return Array(114).fill('');
    const links =
        reciterData.links.length > 114
            ? reciterData.links.slice(0, 114)
            : [...reciterData.links, ...Array(114 - reciterData.links.length).fill('')];
    return links;
}

function findAvailableSurahForReciter(state, excludeIndex = -1) {
    const reciterData = global.reciters?.[state.currentReciter];
    if (!reciterData?.links) return -1;
    const available = [];
    for (let i = 0; i < Math.min(reciterData.links.length, 114); i++) {
        if (i !== excludeIndex && reciterData.links[i]?.startsWith('http')) available.push(i);
    }
    return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : -1;
}

function findWorkingReciter(excludeReciter = null) {
    const available = [];
    for (const [key, data] of Object.entries(global.reciters || {})) {
        if (key === excludeReciter || !data?.links) continue;
        if (data.links.some((l) => l?.startsWith('http'))) available.push(key);
    }
    return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
}

// Nginx and some other proxy setups will randomly throw a 500 or just drop the connection on a cold start.
// This just sends a quick Range request to wake the endpoint up before Lavalink actually tries to play it.
// Without this, half the radio stations fail on the first attempt and we get stuck in a retry loop.
async function warmUpRadioUrl(url, maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);

            const res = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'User-Agent': 'QuranBot/1.0',
                    Accept: 'audio/*, */*;q=0.8',
                    'Icy-MetaData': '1',
                    Range: 'bytes=0-0',
                },
            });
            clearTimeout(timeout);

            if (res.ok || res.status === 206 || res.status === 200) {
                return;
            }

            if (res.status >= 500 && attempt < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
                continue;
            }

            throw new Error(`HTTP ${res.status}`);
        } catch (err) {
            if (attempt === maxAttempts) {
                throw new Error(`Stream warm-up failed after ${maxAttempts} attempts: ${err.message}`);
            }
            await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
        }
    }
}

async function validateStreamUrl(url) {
    if (!url?.startsWith('http')) return { valid: false, reason: 'Invalid URL' };
    try {
        await warmUpRadioUrl(url);
        const client = require('@startup/botSetup').client;
        if (!client.lavalink) return { valid: false, reason: 'Lavalink unavailable' };
        const bestNode = getBestNode(client.lavalink);
        const nodes = bestNode ? [bestNode] : client.lavalink.nodeManager.leastUsedNodes('players').filter((n) => n.connected);
        if (!nodes.length) return { valid: false, reason: 'No connected nodes' };
        const result = await nodes[0].search({ query: url, source: 'http' }, client.user);
        return { valid: result.tracks && result.tracks.length > 0, reason: 'OK' };
    } catch (error) {
        return { valid: false, reason: error.message };
    }
}

async function createSurahResource(state, index) {
    const guildId = state.guildId;
    const MAX_FALLBACK_ATTEMPTS = 5;
    let currentAttempt = 0;
    let currentIndex = index;
    let usedReciters = new Set([state.currentReciter]);

    while (currentAttempt < MAX_FALLBACK_ATTEMPTS) {
        try {
            const url = getReciterLinks(state)[currentIndex];
            if (!url) throw new Error('Surah link unavailable');
            const client = require('@startup/botSetup').client;
            if (!client.lavalink) throw new Error('Lavalink manager not initialized');

            const bestNode = getBestNode(client.lavalink);

            // let searchNode;
            const searchNode = state.player?.node?.connected
                ? state.player.node
                : // : client.lavalink.nodeManager.leastUsedNodes('players').filter((n) => n.connected)[0];
                  bestNode || client.lavalink.nodeManager.leastUsedNodes('players').filter((n) => n.connected)[0];
            if (!searchNode) throw new Error('No connected Lavalink nodes available');

            const result = await searchNode.search({ query: url, source: 'http' }, null);
            if (!result || !result.tracks || result.tracks.length === 0) {
                throw new Error('Track not found on Lavalink');
            }
            const track = result.tracks[0];
            if (!track) throw new Error('Track object is invalid');
            return track;
        } catch (error) {
            currentAttempt++;
            if (currentAttempt >= MAX_FALLBACK_ATTEMPTS) throw error;

            const altSurah = findAvailableSurahForReciter(state, currentIndex);
            if (altSurah !== -1 && altSurah !== currentIndex) {
                logger.debug(`Trying alternate surah ${altSurah + 1} for reciter ${state.currentReciter}`);
                currentIndex = altSurah;
                continue;
            }

            const reciterKeys = Object.keys(global.reciters || {});
            let nextReciter = null;
            for (const key of reciterKeys) {
                if (!usedReciters.has(key) && global.reciters[key]?.links?.some((l) => l?.startsWith('http'))) {
                    nextReciter = key;
                    break;
                }
            }
            if (nextReciter) {
                logger.warn(`Switching reciter from ${state.currentReciter} to ${nextReciter} due to playback failure`);
                state.currentReciter = nextReciter;
                usedReciters.add(nextReciter);
                currentIndex = 0;
                currentAttempt = 0;
                continue;
            }

            throw error;
        }
    }
    throw new Error('Max fallback attempts reached');
}

async function createRadioResource(url) {
    if (!url?.startsWith('http')) throw new Error(`Invalid Radio URL ${url}`);

    await warmUpRadioUrl(url);

    const client = require('@startup/botSetup').client;
    if (!client.lavalink) throw new Error('Lavalink manager not initialized');
    const bestNode = getBestNode(client.lavalink);

    const nodes = bestNode ? [bestNode] : client.lavalink.nodeManager.leastUsedNodes('players').filter((n) => n.connected);
    if (!nodes.length) throw new Error('No connected Lavalink nodes available');

    const searchNode = nodes[0];

    try {
        const result = await searchNode.search({ query: url, source: 'http' }, null);
        if (!result || !result.tracks || result.tracks.length === 0) {
            throw new Error(`Lavalink returned no tracks for URL: ${url}`);
        }
        return result.tracks[0];
    } catch (error) {
        throw new Error(`Failed to load radio stream [${url}]: ${error.message}`);
    }
}

function isSurahAvailable(state, index) {
    const reciterData = global.reciters?.[state.currentReciter];
    if (!reciterData?.links || !reciterData.links[index]) return false;
    const link = reciterData.links[index];
    return typeof link === 'string' && link.trim() !== '' && link.startsWith('http');
}

function getAvailableSurahCount(state) {
    const reciterData = global.reciters?.[state.currentReciter];
    if (!reciterData?.links) return 114;
    return reciterData.links.filter((link) => typeof link === 'string' && link.trim() !== '' && link.startsWith('http')).length;
}

module.exports.createSurahResource = createSurahResource;
module.exports.createRadioResource = createRadioResource;
module.exports.validateStreamUrl = validateStreamUrl;
module.exports.getReciterLinks = getReciterLinks;
module.exports.findAvailableSurahForReciter = findAvailableSurahForReciter;
module.exports.findWorkingReciter = findWorkingReciter;
module.exports.isSurahAvailable = isSurahAvailable;
module.exports.getAvailableSurahCount = getAvailableSurahCount;
