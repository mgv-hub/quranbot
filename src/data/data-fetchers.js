const logger = require('@logging/logger');
const { loadCachedData } = require('@data/data-cache');

function estimateDuration(surahNumber) {
    const baseDurationMs = 60000;
    const multiplier = 0.01;
    const estimatedMs = baseDurationMs * (1 + surahNumber * multiplier);
    const mins = Math.floor(estimatedMs / 60000);
    const secs = Math.floor((estimatedMs % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function fetchSurahs(languageCode) {
    try {
        const cache = await loadCachedData();
        const surahData = cache.surah || {};
        return (surahData.suwar || []).map((surah) => ({
            id: surah.id,
            name: surah.name,
            start_page: surah.start_page,
            end_page: surah.end_page,
            isMeccan: surah.makkia === 1,
            type: surah.type,
            language: languageCode,
        }));
    } catch (error) {
        logger.error('Error Fetching Surahs For ' + languageCode, error);
        return [];
    }
}

async function fetchReciters(languageCode) {
    try {
        const cache = await loadCachedData();
        const reciterData = cache.reciters || {};
        const reciters = {};
        (reciterData.reciters || []).forEach((reciter) => {
            const key = 'reciter_' + reciter.id + '_' + languageCode;
            const links = new Array(114).fill(null);
            const durations = reciter.moshaf ? reciter.moshaf.flatMap((m) => m.surah_list.split(',').map(() => 0)) : Array(114).fill(0);
            if (reciter.moshaf) {
                reciter.moshaf.forEach((m) => {
                    let server = m.server;
                    let ids = m.surah_list.split(',');

                    ids.forEach((id) => {
                        let number = parseInt(id, 10);
                        if (number >= 1 && number <= 114) {
                            const i = number - 1;
                            links[i] = server + String(number).padStart(3, '0') + '.mp3';
                            durations[i] = estimateDuration(number);
                        }
                    });
                });
            }
            reciters[key] = {
                name: reciter.name,
                photo: reciter.photo || '',
                links: links,
                //links: reciter.moshaf
                //    ? reciter.moshaf.flatMap((m) => {
                //          const server = m.server;
                //          return m.surah_list.split(',').map((id) => server + id.padStart(3, '0') + '.mp3');
                //      })
                //    : [],
                durations: durations,
                language: languageCode,
            };
        });
        return reciters;
    } catch (error) {
        logger.error('Error fetching reciters for ' + languageCode, error);
        return {};
    }
}

/**
 * Helper fetchers for auxiliary Quran data types from cached dataset
 */
async function fetchRiwayat(languageCode) {
    try {
        const cache = await loadCachedData();
        return cache.rewayah?.riwayat || [];
    } catch (error) {
        logger.error('Error fetching riwayat for ' + languageCode, error);
        return [];
    }
}

async function fetchMoshaf(languageCode) {
    try {
        const cache = await loadCachedData();
        return cache.moshaf?.moshaf || [];
    } catch (error) {
        logger.error('Error fetching moshaf for ' + languageCode, error);
        return [];
    }
}

async function fetchRadios(languageCode) {
    try {
        const cache = await loadCachedData();
        return cache.radios?.radios || [];
    } catch (error) {
        logger.error('Error fetching radios for ' + languageCode, error);
        return [];
    }
}

async function fetchTafasir(languageCode) {
    try {
        const cache = await loadCachedData();
        return cache.tafasir?.tafasir || [];
    } catch (error) {
        logger.error('Error fetching tafasir for ' + languageCode, error);
        return [];
    }
}

module.exports.fetchSurahs = fetchSurahs;
module.exports.fetchReciters = fetchReciters;
module.exports.fetchRiwayat = fetchRiwayat;
module.exports.fetchMoshaf = fetchMoshaf;
module.exports.fetchRadios = fetchRadios;
module.exports.fetchTafasir = fetchTafasir;
