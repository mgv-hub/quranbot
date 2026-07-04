// lazy-load audio to avoid circular deps
let _audio;
function getAudio() {
    if (!_audio) _audio = require('@audio');
    return _audio;
}

const { createReciterRow, createRadioRow, createSelectRow, createButtonRow, createNavigationRow } = require('@ui/components');

const { createControlEmbed } = require('@ui/embeds');
const { getGuildState, removeGuildState, isAuthorized } = require('../state/GuildStateManager');

const { sendRandomAzkar, startAzkarTimerForGuild } = require('../state/azkarManager');
const { registerCommands, applyCommandPermissions } = require('@registry/commandregistry');
const { checkCooldown, checkRateLimit, checkVoiceCooldown, COOLDOWN_TYPES } = require('@state/cooldown');

const { loadPrayerTimesData, getCountries, getCitiesByCountry, getCitiesForCountry, getCountryByCode } = require('@data/prayerTimesData');
const databaseCleaner = require('../database/firebase/maintenance/databaseCleaner');

module.exports = {
    // Exporting all core registry functions and properties in a single object for easy access throughout the bot
    createSurahResource: () => getAudio().resource?.createSurahResource || getAudio().createSurahResource,
    createRadioResource: () => getAudio().resource?.createRadioResource || getAudio().createRadioResource,
    getCurrentLinks: () => getAudio().resource?.getReciterLinks || getAudio().getCurrentLinks,
    getCurrentDurations: () => getAudio().duration?.getDurationForSurah || getAudio().getDurationForSurah,

    createReciterRow,
    createRadioRow,
    createSelectRow,
    createButtonRow,
    createNavigationRow,
    createControlEmbed,
    getGuildState,
    removeGuildState,
    isAuthorized,
    sendRandomAzkar,
    startAzkarTimerForGuild,
    registerCommands,
    applyCommandPermissions,
    checkCooldown,
    checkRateLimit,
    checkVoiceCooldown,
    COOLDOWN_TYPES,
    loadPrayerTimesData,
    getCountries,
    getCitiesByCountry,
    getCitiesForCountry,
    getCountryByCode,
    databaseCleaner,
};
