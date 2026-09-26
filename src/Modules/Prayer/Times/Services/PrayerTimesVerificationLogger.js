const logger = require('@infrastructure/Logging/Logger');
const { getCountries, getCitiesForCountry } = require('@data/PrayerTimes/PrayerTimesData');
const { fetchPrayerTimes } = require('@modules/Prayer/Times/Interactions/Buttons/PrayerTimesApiDataFetcher');

let verificationInterval = null;

async function verifyAllCountriesPrayerTimes() {
    const countries = getCountries();
    if (!countries || countries.length === 0) {
        logger.prayer('Prayer verification skipped no countries loaded');
        return { success: false, reason: 'No countries loaded' };
    }

    logger.prayer(`Starting prayer times verification for ${countries.length} countries`);

    const startTime = Date.now();
    let totalCities = 0;
    let successfulCalculations = 0;
    let failedCalculations = 0;
    const results = [];

    for (const country of countries) {
        const cities = getCitiesForCountry(country.code);
        if (!cities || cities.length === 0) {
            continue;
        }

        const countryResults = {
            country: country.name,
            code: country.code,
            flag: country.flag || '🌍',
            cities: [],
        };

        for (const city of cities) {
            totalCities++;
            try {
                const prayerData = await fetchPrayerTimes(city.lat, city.lng, city.name, country.code);
                
                if (prayerData) {
                    successfulCalculations++;
                    countryResults.cities.push({
                        city: city.name,
                        fajr: prayerData.fajr,
                        sunrise: prayerData.sunrise,
                        dhuhr: prayerData.dhuhr,
                        asr: prayerData.asr,
                        maghrib: prayerData.maghrib,
                        isha: prayerData.isha,
                        hijriDate: prayerData.hijriDate,
                        gregorianDate: prayerData.gregorianDate,
                    });

                } else {
                    failedCalculations++;
                    logger.warn(`Failed to calculate prayer times for ${city.name}, ${country.name}`);
                }
            } catch (error) {
                failedCalculations++;
                logger.error(`Error calculating prayer times for ${city.name}, ${country.name}`, error);
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        results.push(countryResults);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    return {
        success: true,
        duration: parseFloat(duration),
        countries: countries.length,
        totalCities,
        successfulCalculations,
        failedCalculations,
        results,
    };
}

function startPrayerVerificationScheduler() {
    if (verificationInterval) {
        clearInterval(verificationInterval);
    }

    verifyAllCountriesPrayerTimes().catch((err) => {
        logger.error('Initial prayer verification failed', err);
    });

    verificationInterval = setInterval(() => {
        verifyAllCountriesPrayerTimes().catch((err) => {
            logger.error('Scheduled prayer verification failed', err);
        });
    }, 24 * 60 * 60 * 1000);

    if (verificationInterval && typeof verificationInterval.unref === 'function') {
        verificationInterval.unref();
    }

    logger.prayer('Prayer times verification scheduler started (runs every 24 hours)');
}

function stopPrayerVerificationScheduler() {
    if (verificationInterval) {
        clearInterval(verificationInterval);
        verificationInterval = null;
        logger.prayer('Prayer times verification scheduler stopped');
    }
}

module.exports.verifyAllCountriesPrayerTimes = verifyAllCountriesPrayerTimes;
module.exports.startPrayerVerificationScheduler = startPrayerVerificationScheduler;
module.exports.stopPrayerVerificationScheduler = stopPrayerVerificationScheduler;
