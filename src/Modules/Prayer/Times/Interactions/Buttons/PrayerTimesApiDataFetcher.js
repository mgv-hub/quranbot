const logger = require('@infrastructure/Logging/Logger');
const adhan = require('adhan');
const { getTimeFormatForCountry } = require('@data/PrayerTimes/PrayerTimesData');
const { prayer_times_config } = require('@config/Constants');

function getTargetDate(countryCode) {
    const timezone = prayer_times_config.country_timezones[countryCode] || 'UTC';
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find((p) => p.type === 'year').value, 10);
    const month = parseInt(parts.find((p) => p.type === 'month').value, 10);
    const day = parseInt(parts.find((p) => p.type === 'day').value, 10);
    return new Date(year, month - 1, day, 12, 0, 0);
}

function getCalculationParams(countryCode) {
    switch (countryCode) {
        case 'EG':
            return adhan.CalculationMethod.Egyptian();
        case 'SA':
            return adhan.CalculationMethod.UmmAlQura();
        case 'KW':
        case 'QA':
        case 'BH':
            return adhan.CalculationMethod.MuslimWorldLeague();
        case 'AE':
            return adhan.CalculationMethod.Karachi();
        default:
            return adhan.CalculationMethod.NorthAmerica();
    }
}

function formatPrayerTime(date, countryCode) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return 'غير متاح';
    const timezone = prayer_times_config.country_timezones[countryCode] || 'UTC';
    const timeFormat = getTimeFormatForCountry(countryCode);
    if (timeFormat === '12') {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
        const parts = formatter.formatToParts(date);
        const hour = parts.find((p) => p.type === 'hour').value;
        const minute = parts.find((p) => p.type === 'minute').value;
        const dayPeriod = parts.find((p) => p.type === 'dayPeriod').value;
        const ampm = dayPeriod === 'AM' ? 'ص' : 'م';
        const h = hour.padStart(2, '0');
        return `${h}:${minute} ${ampm}`;
    } else {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        const parts = formatter.formatToParts(date);
        const hour = parts.find((p) => p.type === 'hour').value;
        const minute = parts.find((p) => p.type === 'minute').value;
        return `${hour}:${minute}`;
    }
}

async function fetchPrayerTimes(lat, lng, cityName, countryCode) {
    try {
        const coordinates = new adhan.Coordinates(lat, lng);
        const date = getTargetDate(countryCode);
        const params = getCalculationParams(countryCode);
        const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);
        const timezone = prayer_times_config.country_timezones[countryCode] || 'UTC';
        const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
            timeZone: timezone,
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
        const gregorianFormatter = new Intl.DateTimeFormat('ar-EG', {
            timeZone: timezone,
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
        return {
            fajr: formatPrayerTime(prayerTimes.fajr, countryCode),
            sunrise: formatPrayerTime(prayerTimes.sunrise, countryCode),
            dhuhr: formatPrayerTime(prayerTimes.dhuhr, countryCode),
            asr: formatPrayerTime(prayerTimes.asr, countryCode),
            maghrib: formatPrayerTime(prayerTimes.maghrib, countryCode),
            isha: formatPrayerTime(prayerTimes.isha, countryCode),
            hijriDate: hijriFormatter.format(date),
            gregorianDate: gregorianFormatter.format(date),
            cityName: cityName,
            countryCode: countryCode,
            method: 'Local Calculation',
        };
    } catch (error) {
        logger.error('Error calculating prayer times locally', {
            city: cityName,
            message: error?.message,
            stack: error?.stack,
        });
        return null;
    }
}

module.exports.fetchPrayerTimes = fetchPrayerTimes;
