const logger = require('@infrastructure/Logging/Logger');
const adhan = require('adhan');
const { prayer_reminder_config } = require('@config/Constants');
const state = require('@modules/Prayer/Reminders/Services/PrayerReminderState');

function cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of state.prayerTimesCache.entries()) {
        if (now - entry.cachedAt > prayer_reminder_config.cache_ttl_ms) {
            state.prayerTimesCache.delete(key);
        }
    }
}

function startCacheCleanup() {
    if (state.cacheCleanupTimer) return;
    state.cacheCleanupTimer = setInterval(cleanupCache, prayer_reminder_config.cache_cleanup_interval_ms);
    if (state.cacheCleanupTimer.unref) state.cacheCleanupTimer.unref();
}

function getCalculationParams(method) {
    switch (method) {
        case 5: return adhan.CalculationMethod.Egyptian();
        case 4: return adhan.CalculationMethod.UmmAlQura();
        case 3: return adhan.CalculationMethod.MuslimWorldLeague();
        case 1: return adhan.CalculationMethod.Karachi();
        default: return adhan.CalculationMethod.NorthAmerica();
    }
}

function getTargetDateFromTimezone(timezone) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find(p => p.type === 'year').value, 10);
    const month = parseInt(parts.find(p => p.type === 'month').value, 10);
    const day = parseInt(parts.find(p => p.type === 'day').value, 10);
    
    return new Date(year, month - 1, day, 12, 0, 0);
}

function formatPrayerTimeForScheduler(date, timezone) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '00:00';
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    const parts = formatter.formatToParts(date);
    const hour = parts.find(p => p.type === 'hour').value;
    const minute = parts.find(p => p.type === 'minute').value;
    return `${hour}:${minute}`;
}

async function fetchPrayerTimesWithTimezone(lat, lng, method, timezone) {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)},${method},${timezone}`;
    const now = Date.now();
    const cached = state.prayerTimesCache.get(cacheKey);

    if (cached && now - cached.cachedAt < prayer_reminder_config.cache_ttl_ms) {
        return cached.data;
    }
    if (state.inflightFetches.has(cacheKey)) {
        return state.inflightFetches.get(cacheKey);
    }

    const fetchPromise = (async () => {
        try {
            const coordinates = new adhan.Coordinates(lat, lng);
            const targetDate = getTargetDateFromTimezone(timezone);
            const params = getCalculationParams(method);
            
            const prayerTimes = new adhan.PrayerTimes(coordinates, targetDate, params);

            const day = String(targetDate.getDate()).padStart(2, '0');
            const month = String(targetDate.getMonth() + 1).padStart(2, '0');
            const year = targetDate.getFullYear();

            const data = {
                timings: {
                    Fajr: formatPrayerTimeForScheduler(prayerTimes.fajr, timezone),
                    Sunrise: formatPrayerTimeForScheduler(prayerTimes.sunrise, timezone),
                    Dhuhr: formatPrayerTimeForScheduler(prayerTimes.dhuhr, timezone),
                    Asr: formatPrayerTimeForScheduler(prayerTimes.asr, timezone),
                    Maghrib: formatPrayerTimeForScheduler(prayerTimes.maghrib, timezone),
                    Isha: formatPrayerTimeForScheduler(prayerTimes.isha, timezone),
                },
                timezone: timezone,
                dateStr: `${day}-${month}-${year}`,
            };

            state.prayerTimesCache.set(cacheKey, { data, cachedAt: Date.now() });
            return data;
        } catch (error) {
            logger.prayer('Local calculation failed permanently', {
                key: cacheKey,
                error: error?.message,
                stack: error?.stack
            });
            return null;
        } finally {
            state.inflightFetches.delete(cacheKey);
        }
    })();
    
    state.inflightFetches.set(cacheKey, fetchPromise);
    return fetchPromise;
}

module.exports.cleanupCache = cleanupCache;
module.exports.startCacheCleanup = startCacheCleanup;
module.exports.fetchPrayerTimesWithTimezone = fetchPrayerTimesWithTimezone;
