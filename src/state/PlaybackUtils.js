function restorePlaybackState(gs) {
    const savedQuran = gs.savedQuranState;
    const savedRadio = gs.savedRadioState;

    if (savedQuran) {
        gs.playbackMode = 'surah';
        gs.currentReciter = savedQuran.currentReciter;
        gs.currentSurah = savedQuran.currentSurah;
        gs.currentPage = savedQuran.currentPage;
        gs.currentReciterPage = savedQuran.currentReciterPage;
        gs.playedOffset = savedQuran.playedOffset || 0;
        return;
    }

    if (savedRadio && global.quranRadios?.[savedRadio.currentRadioIndex]) {
        gs.playbackMode = 'radio';
        gs.currentRadioIndex = savedRadio.currentRadioIndex;
        gs.currentRadioPage = savedRadio.currentRadioPage;
        gs.currentRadioUrl = savedRadio.currentRadioUrl || global.quranRadios[savedRadio.currentRadioIndex].url;
        gs.playedOffset = savedRadio.playedOffset || 0;
        return;
    }

    gs.playbackMode = 'radio';
    const len = global.quranRadios?.length || 0;
    const idx = len > 3 ? 3 : 0;
    gs.currentRadioIndex = idx;
    gs.currentRadioPage = Math.floor(idx / 25);
    gs.currentRadioUrl = global.quranRadios?.[idx]?.url || global.quranRadios?.[0]?.url;
    gs.playedOffset = 0;
}

module.exports.restorePlaybackState = restorePlaybackState;
