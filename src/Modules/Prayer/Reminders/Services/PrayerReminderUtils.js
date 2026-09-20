const { PRAYER_MAP } = require('@modules/Prayer/Reminders/Services/PrayerReminderConstants');

function getLocalDateString(timezone) {
    try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        const parts = formatter.formatToParts(new Date());
        const get = (type) => parts.find((p) => p.type === type)?.value || '01';
        return `${get('day')}-${get('month')}-${get('year')}`;
    } catch {
        const now = new Date();
        return `${String(now.getUTCDate()).padStart(2, '0')}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${now.getUTCFullYear()}`;
    }
}

function getUtcTimestampFromAladhan(dateStr, timeStr, timezone) {
    const [d, m, y] = dateStr.split('-').map(Number);
    const timeParts = timeStr.split(':').map(Number);
    if (timeParts.length < 2 || isNaN(timeParts[0]) || isNaN(timeParts[1])) {
        throw new Error(`Invalid time string: ${timeStr}`);
    }

    const h = timeParts[0];
    const min = timeParts[1];
    if (h < 0 || h > 23 || min < 0 || min > 59) {
        throw new Error(`Out of bounds time: ${timeStr}`);
    }
    const guessUtc = new Date(Date.UTC(y, m - 1, d, h, min, 0));

    const tzFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    const parts = tzFormatter.formatToParts(guessUtc);
    const getPart = (type) => {
        const found = parts.find((p) => p.type === type);
        return found ? parseInt(found.value, 10) : 0;
    };

    const tzY = getPart('year');
    const tzM = getPart('month');
    const tzD = getPart('day');
    const tzH = getPart('hour') === 24 ? 0 : getPart('hour');
    const tzMin = getPart('minute');
    const tzDate = new Date(Date.UTC(tzY, tzM - 1, tzD, tzH, tzMin, 0));
    const offsetMs = tzDate.getTime() - guessUtc.getTime();
    const result = guessUtc.getTime() - offsetMs;

    if (!Number.isFinite(result)) {
        throw new Error('Generated timestamp is not finite');
    }

    return result;
}

function buildReminderComponents(job, timeUntilAdhanMs) {
    const totalSecs = Math.max(0, Math.floor(timeUntilAdhanMs / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const timeStr = mins > 0 ? `${mins} دقيقة و ${secs} ثانية` : `${secs} ثانية`;
    const prayerNames = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
    const prayerName = prayerNames[job.prayerName] || job.prayerName;

    const containerComponents = [];

    const mentions = [];
    if (job.mentionEveryone) mentions.push('@everyone');
    if (job.mentionHere) mentions.push('@here');
    if (job.roles && job.roles.length > 0) {
        mentions.push(...job.roles.map((r) => `<@&${r}>`));
    }

    if (mentions.length > 0) {
        containerComponents.push({ type: 10, content: mentions.join(' ') });
        containerComponents.push({ type: 14, divider: true, spacing: 1 });
    }

    containerComponents.push({ type: 10, content: `### 🕌 تذكير بالصلاة` });
    containerComponents.push({ type: 14, divider: true, spacing: 1 });
    containerComponents.push({ type: 10, content: `**تذكير لأهل ${job.cityName} - ${job.countryName}**` });
    containerComponents.push({ type: 14, divider: false, spacing: 2 });
    containerComponents.push({ type: 10, content: `حان وقت الاستعداد لأذان **${prayerName}**.` });
    containerComponents.push({ type: 10, content: `متبقي على الأذان تقريباً **${timeStr}**.` });
    containerComponents.push({ type: 14, divider: true, spacing: 1 });
    containerComponents.push({
        type: 10,
        content: `**ميزة تجريبية.** للمشاكل أو الشكاوى والاقتراحات: \`تحكم\` ← **المزيد** ← **تقديم شكوى أو اقتراح**.`,
    });

    if (job.prayerName === 'fajr') {
        containerComponents.push({ type: 14, divider: true, spacing: 1 }, { type: 10, content: `**الصَّلاةُ خَيْرٌ مِنَ النَّوْمِ**` });
    } else if (job.prayerName === 'isha') {
        containerComponents.push(
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: `**إِنَّ صَلَاةَ الْعِشَاءِ لَتَثْقُلُ إِلَّا عَلَى الْمُنَافِقِينَ**` },
        );
    }

    return [{ type: 17, accent_color: 0xfefdfe, components: containerComponents }];
}

module.exports.getLocalDateString = getLocalDateString;
module.exports.getUtcTimestampFromAladhan = getUtcTimestampFromAladhan;
module.exports.buildReminderComponents = buildReminderComponents;
module.exports.buildReminderContent = buildReminderComponents;
