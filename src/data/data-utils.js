// Validate that cached data has the minimum required structure for surahs and reciters
function isValidCacheData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.surah || !data.surah.suwar || data.surah.suwar.length === 0) return false;
    if (!data.reciters || !data.reciters.reciters || data.reciters.reciters.length === 0) return false;
    return true;
}

function parseDurationToSeconds(duration) {
    if (typeof duration === 'number') {
        return duration;
    }

    if (typeof duration === 'string') {
        const timeParts = duration.split(':').map((part) => parseInt(part, 10));

        if (timeParts.length === 2) {
            return timeParts[0] * 60 + (timeParts[1] || 0);
        }
        if (timeParts.length === 3) {
            return timeParts[0] * 3600 + timeParts[1] * 60 + (timeParts[2] || 0);
        }

        const numericValue = parseInt(duration, 10);
        if (!isNaN(numericValue)) {
            return numericValue;
        }
    }

    return 0;
}

// Format seconds into human-readable Arabic duration text
function formatDurationText(seconds) {
    if (!seconds || seconds <= 0) {
        return 'غير متاح';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let formatted = '';
    if (hours > 0) {
        formatted += hours + ' ساعة ';
    }
    if (minutes > 0) {
        formatted += minutes + ' دقيقة ';
    }
    if (remainingSeconds > 0 || formatted === '') {
        formatted += remainingSeconds + ' ثانية';
    }

    return formatted.trim();
}

module.exports.isValidCacheData = isValidCacheData;
module.exports.parseDurationToSeconds = parseDurationToSeconds;
module.exports.formatDurationText = formatDurationText;
