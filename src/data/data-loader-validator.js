const { GLOBAL_CONSTANTS } = require('@data/data-loader-constants');
// 114
function validateSurahId(surahId) {
    return surahId >= 1 && surahId <= GLOBAL_CONSTANTS.total_surahs;
}

function validateSurahList(surahs) {
    if (!Array.isArray(surahs)) return false;
    return surahs.every((s) => s.id && validateSurahId(s.id));
}

function validateReciterData(reciter) {
    return reciter.rewaya_id && reciter.server;
}

function validateRadioData(radio) {
    return radio.url && radio.url.length > 0;
}

function validateAdhkarData(data) {
    return Array.isArray(data) && data.length > 0;
}

function normalizeSurahCount(surahNames) {
    if (!surahNames || surahNames.length > GLOBAL_CONSTANTS.total_surahs) {
        return surahNames ? surahNames.slice(0, GLOBAL_CONSTANTS.total_surahs) : [];
    }

    // Pad with default names if we're missing entries
    if (surahNames.length < GLOBAL_CONSTANTS.total_surahs) {
        const normalized = [...surahNames];
        while (normalized.length < GLOBAL_CONSTANTS.total_surahs) {
            normalized.push(`${GLOBAL_CONSTANTS.DEFAULT_SURAH_NAME_PREFIX}${normalized.length + 1}`);
        }
        return normalized;
    }
    return surahNames;
}

module.exports.validateSurahId = validateSurahId;
module.exports.validateSurahList = validateSurahList;
module.exports.validateReciterData = validateReciterData;
module.exports.validateRadioData = validateRadioData;
module.exports.validateAdhkarData = validateAdhkarData;
module.exports.normalizeSurahCount = normalizeSurahCount;
