// time labels for en/ar
const labels = {
    en: {
        seconds: 'Seconds',
        minutes: 'Minutes',
        hours: 'Hours',
        days: 'Days',
        months: 'Months',
        years: 'Years',
    },
    ar: {
        seconds: 'ثوانٍ',
        minutes: 'دقائق',
        hours: 'ساعات',
        days: 'أيام',
        months: 'شهور',
        years: 'سنين',
    },
};

// Converts milliseconds to a human-readable duration string in the specified language
function formatTimeDuration(ms, lang = 'en') {
    const t = labels[lang] || labels.en;
    let secs = Math.floor(ms / 1000);

    const years = Math.floor(secs / (365 * 24 * 60 * 60));
    secs -= years * (365 * 24 * 60 * 60);

    const months = Math.floor(secs / (30 * 24 * 60 * 60));
    secs -= months * (30 * 24 * 60 * 60);

    const days = Math.floor(secs / (24 * 60 * 60));
    secs -= days * (24 * 60 * 60);

    const hrs = Math.floor(secs / (60 * 60));
    secs -= hrs * (60 * 60);

    const mins = Math.floor(secs / 60);
    secs -= mins * 60;

    const parts = [];

    if (years > 0) parts.push(`${years} ${t.years}`);
    if (months > 0) parts.push(`${months} ${t.months}`);

    if (days > 0) parts.push(`${days} ${t.days}`);
    if (hrs > 0) parts.push(`${hrs} ${t.hours}`);

    if (mins > 0) parts.push(`${mins} ${t.minutes}`);

    if (secs > 0 || parts.length === 0) parts.push(`${secs} ${t.seconds}`);

    return parts.join(' ');
}

module.exports = formatTimeDuration;
