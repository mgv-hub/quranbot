// lazy-load audio to avoid circular deps
let _audio;
function getAudio() {
    if (!_audio) _audio = require('@modules/Audio/AudioModule');
    return _audio;
}

const {
    createReciterRow,
    createRadioRow,
    createSelectRow,
    createButtonRow,
    createNavigationRow,
} = require('@infrastructure/Discord/UI/Components');

const { createControlEmbed } = require('@infrastructure/Discord/UI/Embeds');
const { getGuildState, removeGuildState, isAuthorized } = require('@state/GuildStateManager');

const { sendRandomAzkar, startAzkarTimerForGuild } = require('@modules/Azkar/AzkarModule');
const { registerCommands, applyCommandPermissions } = require('@core/CommandRegistry');
const { checkCooldown, checkRateLimit, checkVoiceCooldown, COOLDOWN_TYPES } = require('@state/Cooldown');

const {
    loadPrayerTimesData,
    getCountries,
    getCitiesByCountry,
    getCitiesForCountry,
    getCountryByCode,
} = require('@data/PrayerTimes/PrayerTimesData');
const databaseCleaner = require('@infrastructure/Persistence/Firebase/Maintenance/DatabaseCleaner');

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
