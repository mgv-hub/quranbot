const logger = require('@logging/logger');
const { loadCachedData } = require('@data/data-cache');
const { fetchSurahs, fetchReciters, fetchRiwayat, fetchMoshaf, fetchRadios, fetchTafasir } = require('@data/data-fetchers');
const { loadRemoteAzkarData } = require('@data/data-azkar');
const { loadSetupGuilds, saveSetupGuilds, updateGuildNames } = require('@data/data-guilds');
const azkar_images_base = 'https://hub-mgv.github.io/QuranBotData/azkar-images/';

async function loadData() {
    try {
        const cachedData = await loadCachedData();
        // Load surah data
        const surahRegistry = {};
        const apiSurahs = await fetchSurahs('ar');
        apiSurahs.forEach((surah) => {
            if (!surahRegistry[surah.id]) {
                surahRegistry[surah.id] = surah;
            }
        });
        const cachedSurahNames = Object.values(surahRegistry).map((s) => s.name);
        logger.info('Successfully loaded surah names, count: ' + cachedSurahNames.length);

        const reciterRegistry = {};
        const apiReciters = await fetchReciters('ar');
        Object.assign(reciterRegistry, apiReciters);
        global.reciters = reciterRegistry;
        logger.info('Loaded reciters, count: ' + Object.keys(global.reciters).length);
        global.riwayat = await fetchRiwayat('ar');
        global.moshaf = await fetchMoshaf('ar');

        const radiosData = await fetchRadios('ar');
        global.quranRadios = (radiosData || []).map((radio) => ({
            id: radio.id,
            name: radio.name,
            url: radio.url,
        }));

        logger.info('Loaded radio stations, count: ' + global.quranRadios.length);
        global.tafasir = await fetchTafasir('ar');
        global.azkarData = await loadRemoteAzkarData();
        global.azkarImages = [
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
        logger.info('Loaded ' + global.azkarImages.length + ' azkar image URLs from remote server');
        const guildSetupData = await loadSetupGuilds();
        global.surahNames = cachedSurahNames;
        global.reciterNamesList = Object.values(global.reciters)
            .map((r) => r.name)
            .join(' & ');
        global.setupGuilds = guildSetupData;
        global.saveSetupGuilds = saveSetupGuilds;
        await updateGuildNames();
        await saveSetupGuilds();
        logger.info('All data loaded successfully from remote endpoint');
    } catch (error) {
        logger.error('Critical error during data loading', error);
        process.exit(1);
    }
}
module.exports.loadData = loadData;
module.exports.saveSetupGuilds = saveSetupGuilds;
