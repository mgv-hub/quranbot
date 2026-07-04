const { player_config } = require('@interactions/buttons/sys-config');

function getAvailableSurahIndex(guildState, maxAttempts = player_config.MAX_SURAH_ATTEMPTS) {
    const reciterData = global.reciters[guildState.currentReciter];

    if (!reciterData || !reciterData.links) {
        return Math.floor(Math.random() * 114) + 1;
    }

    const audioLinks = reciterData.links;
    const validIndices = [];

    for (let i = 0; i < audioLinks.length; i++) {
        if (audioLinks[i] && audioLinks[i].trim() !== '' && audioLinks[i].startsWith('http')) {
            validIndices.push(i + 1);
        }
    }

    if (validIndices.length === 0) return 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const randomIdx = Math.floor(Math.random() * validIndices.length);
        const surahNum = validIndices[randomIdx];
        if (surahNum <= 114) {
            return surahNum;
        }
    }

    return validIndices[0];
}

function getReciterInfo(reciterKey) {
    const reciterData = global.reciters[reciterKey];

    if (!reciterData) {
        return { name: 'غير محدد', availableCount: 114 };
    }

    const displayName = reciterData?.name || reciterKey;
    const availableCount = reciterData?.links?.filter((link) => link && link.trim() !== '' && link.startsWith('http'))?.length || 114;

    return { name: displayName, availableCount };
}

module.exports.getAvailableSurahIndex = getAvailableSurahIndex;
module.exports.getReciterInfo = getReciterInfo;
