const { getTimeFormatForCountry } = require('@data/PrayerTimes/PrayerTimesData');

function formatTime(time24, countryCode) {
    if (!time24 || typeof time24 !== 'string') return 'غير متاح';

    const timeFormat = getTimeFormatForCountry(countryCode);
    const parts = time24.split(':');

    if (parts.length < 2) return time24;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];

    if (timeFormat === '24') {
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    } else {
        const ampm = hours >= 12 ? 'م' : 'ص';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const hoursStr = hours.toString().padStart(2, '0');
        const minutesStr = minutes.toString().padStart(2, '0');
        return `${hoursStr}:${minutesStr} ${ampm}`;
    }
}

module.exports.formatTime = formatTime;
