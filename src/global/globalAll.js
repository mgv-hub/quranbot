const { createSurahResource, createRadioResource, getReciterLinks, findWorkingReciter, findAvailableSurahForReciter } = require('@audio');

const {
    createReciterRow,
    createRadioRow,
    createControlModeRow,
    getGuildState,
    removeGuildState,
    createControlEmbed,
    createSelectRow,
    createButtonRow,
    createNavigationRow,
    sendRandomAzkar,
    startAzkarTimerForGuild,
    registerCommands,
    applyCommandPermissions,
    isAuthorized,
    setupQuranCategory,
    checkCooldown,
    checkRateLimit,
    checkVoiceCooldown,
} = require('@registry/registry');

global.createSurahResource = createSurahResource;
global.createRadioResource = createRadioResource;
global.getCurrentLinks = getReciterLinks;
global.getCurrentDurations = null;
global.createReciterRow = createReciterRow;
global.createRadioRow = createRadioRow;
global.createControlModeRow = createControlModeRow;
global.getGuildState = getGuildState;
global.removeGuildState = removeGuildState;
global.createControlEmbed = createControlEmbed;
global.createSelectRow = createSelectRow;
global.createButtonRow = createButtonRow;
global.createNavigationRow = createNavigationRow;
global.sendRandomAzkar = sendRandomAzkar;
global.startAzkarTimerForGuild = startAzkarTimerForGuild;
global.registerCommands = registerCommands;
global.applyCommandPermissions = applyCommandPermissions;
global.isAuthorized = isAuthorized;
global.setupQuranCategory = setupQuranCategory;
global.checkCooldown = checkCooldown;
global.checkRateLimit = checkRateLimit;
global.checkVoiceCooldown = checkVoiceCooldown;
global.findWorkingReciter = findWorkingReciter;
global.findAvailableSurahForReciter = findAvailableSurahForReciter;

module.exports = {};
