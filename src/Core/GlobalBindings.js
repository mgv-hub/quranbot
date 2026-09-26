const {
    createSurahResource,
    createRadioResource,
    getReciterLinks,
    findWorkingReciter,
    findAvailableSurahForReciter,
} = require('@modules/Audio/AudioModule');

const {
    createReciterRow,
    createRadioRow,
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
    checkRateLimit,
} = require('@core/ServiceRegistry');

const { MessageFlags, PermissionsBitField, ChannelType } = require('discord.js');
const stateCooldown = require('@state/Cooldown');
const commandCooldown = require('@state/CommandCooldown');

// checkCooldown has two legacy call signatures: (userId, COOLDOWN_TYPE, key) from voice
// cooldown checks and (userId, guildId, commandName) from command/button cooldown checks.
// Guild ids are numeric strings so they never collide with COOLDOWN_TYPES values.
function checkCooldown(userId, guildIdOrType, cmdNameOrKey) {
    if (typeof guildIdOrType === 'string' && Object.values(stateCooldown.COOLDOWN_TYPES).includes(guildIdOrType)) {
        return stateCooldown.checkCooldown(userId, guildIdOrType, cmdNameOrKey);
    }
    return commandCooldown.checkCooldown(userId, guildIdOrType, cmdNameOrKey);
}

global.createSurahResource = createSurahResource;
global.createRadioResource = createRadioResource;
global.getCurrentLinks = getReciterLinks;
global.getCurrentDurations = null;
global.createReciterRow = createReciterRow;
global.createRadioRow = createRadioRow;
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
global.checkCooldown = checkCooldown;
global.checkRateLimit = checkRateLimit;
global.findWorkingReciter = findWorkingReciter;
global.findAvailableSurahForReciter = findAvailableSurahForReciter;

// Everything below attaches to the existing module.exports object (never reassign it):
// modules required from here may in turn require this file mid-load and keep the same
// reference, so property getters keep the registry safe under circular requires.
const bindings = module.exports;

bindings.logger = require('@infrastructure/Logging/Logger');
bindings.MessageFlags = MessageFlags;
bindings.PermissionsBitField = PermissionsBitField;
bindings.ChannelType = ChannelType;
bindings.checkCooldown = checkCooldown;
bindings.checkRateLimit = checkRateLimit;
bindings.COOLDOWN_TYPES = stateCooldown.COOLDOWN_TYPES;
bindings.isUserInGlobalCooldown = stateCooldown.isUserInGlobalCooldown;
bindings.setCooldown = commandCooldown.setCooldown;
bindings.getCooldownResponse = commandCooldown.getCooldownResponse;
bindings.createSurahResource = createSurahResource;
bindings.createRadioResource = createRadioResource;
bindings.getReciterLinks = getReciterLinks;
bindings.findWorkingReciter = findWorkingReciter;
bindings.findAvailableSurahForReciter = findAvailableSurahForReciter;
bindings.createReciterRow = createReciterRow;
bindings.createRadioRow = createRadioRow;
bindings.createControlEmbed = createControlEmbed;
bindings.createSelectRow = createSelectRow;
bindings.createButtonRow = createButtonRow;
bindings.createNavigationRow = createNavigationRow;
bindings.getGuildState = getGuildState;
bindings.removeGuildState = removeGuildState;
bindings.isAuthorized = isAuthorized;
bindings.registerCommands = registerCommands;
bindings.applyCommandPermissions = applyCommandPermissions;
bindings.sendRandomAzkar = sendRandomAzkar;
bindings.startAzkarTimerForGuild = startAzkarTimerForGuild;

const COMMAND_MODULES = {
    pingCommand: '@modules/Community/Commands/PingCommand',
    joinCommand: '@modules/Audio/Commands/JoinCommand',
    joinChannelCommand: '@modules/Audio/Commands/JoinChannelCommand',
    leaveCommand: '@modules/Audio/Commands/LeaveCommand',
    controlCommand: '@modules/Admin/Commands/ControlCommand',
    setupCommand: '@modules/Setup/Commands/SetupCommand',
    guideCommand: '@modules/Community/Commands/GuideCommand',
    prayerTimesCommand: '@modules/Prayer/Times/Commands/PrayerTimesCommand',
    sourcesCommand: '@modules/Admin/Commands/SourcesCommand',
    changelogCommand: '@modules/Community/Commands/ChangelogCommand',
    helpCommand: '@modules/Community/Commands/HelpCommand',
    tafseerCommand: '@modules/Quran/Commands/TafseerCommand',
    searchCommand: '@modules/Quran/Commands/SearchWordCommand',
    surahCommand: '@modules/Quran/Commands/SurahCommand',
    tasbihCommand: '@modules/Tasbih/Commands/TasbihCommand',
    assignChannelsCommand: '@modules/Admin/Commands/AssignChannelsCommand',
    prayerReminderCommand: '@modules/Prayer/Reminders/Commands/PrayerReminderCommand',
    contributorsCommand: '@modules/Community/Commands/ContributorsCommand',
};

const BUTTON_MODULES = {
    navigationButtons: '@modules/Admin/Interactions/Buttons/NavigationButton',
    playbackButtons: '@modules/Audio/Interactions/Buttons/PlaybackButton',
    radioButtons: '@modules/Audio/Interactions/Buttons/RadioControlButton',
    systemButtons: '@shared/Errors/SystemControlButton',
    adminServerListButton: '@modules/Admin/Interactions/Buttons/AdminServerListButton',
    adminBotStatsButton: '@modules/Admin/Interactions/Buttons/AdminBotStatsButton',
    adminVoiceChannelsPagination: '@modules/Admin/Interactions/Buttons/AdminVoiceChannelsPaginationButton',
    adminServerListPagination: '@modules/Admin/Interactions/Buttons/AdminServerListPaginationButton',
    complaintButton: '@modules/Community/Interactions/Buttons/ComplaintButton',
    openComplaintModalButton: '@modules/Community/Interactions/Buttons/OpenComplaintModalButton',
    adminPanelButton: '@modules/Admin/Interactions/Buttons/AdminPanelButton',
    adminSendMessageButton: '@modules/Admin/Interactions/Buttons/AdminSendMessageButton',
    adminResponseModalButton: '@modules/Admin/Interactions/Buttons/AdminResponseModalButton',
    prayerTimesButton: '@modules/Prayer/Times/Interactions/Buttons/PrayerTimesButton',
    prayerTimesNavigation: '@modules/Prayer/Times/Interactions/Buttons/PrayerNavigationRouter',
    moreFeaturesButton: '@modules/Community/Interactions/Buttons/MoreFeaturesButton',
    backToMainButton: '@modules/Admin/Interactions/Buttons/BackToMainButton',
    lavalinkNodesButton: '@modules/Audio/Interactions/Buttons/LavalinkNodesButton',
    notificationRolesButton: '@modules/Notifications/Interactions/Buttons/NotificationRolesButton',
    tafseerRestartButton: '@modules/Quran/Interactions/Buttons/TafseerRestartButton',
    azkarSettingsButton: '@modules/Azkar/Interactions/Buttons/AzkarSettingsButton',
    azkarAudioButton: '@modules/Azkar/Interactions/Buttons/AzkarAudioButton',
    tasbihCounterButton: '@modules/Tasbih/Interactions/Buttons/TasbihCounterButton',
    spreadBotButton: '@modules/Community/Interactions/Buttons/SpreadBotButton',
    spreadBotContinueButton: '@modules/Community/Interactions/Buttons/SpreadBotContinueButton',
    spreadBotCancelButton: '@modules/Community/Interactions/Buttons/SpreadBotCancelButton',
    spreadBotSendButton: '@modules/Community/Interactions/Buttons/SpreadBotSendButton',
    assignChannelsButton: '@modules/Admin/Interactions/Buttons/AssignChannelsButton',
    joinChannelPromptButton: '@modules/Audio/Interactions/Buttons/JoinChannelPromptButton',
    contributorsButton: '@modules/Community/Interactions/Buttons/ContributorsButton',
    adminStatusManager: '@modules/Admin/Interactions/Buttons/AdminStatusManagerButton',
    adminKickBotButton: '@modules/Admin/Interactions/Buttons/AdminKickBotButton',
    adminConfirmKickButton: '@modules/Admin/Interactions/Buttons/AdminConfirmKickButton',
    adminBackupDownloadButton: '@modules/Admin/Interactions/Buttons/AdminBackupDownloadButton',
    tafseerPaginationButton: '@modules/Quran/Interactions/Buttons/TafseerPaginationButton',
    searchPaginationButton: '@modules/Quran/Interactions/Buttons/SearchPaginationButton',
    prayerReminderSetupButton: '@modules/Prayer/Reminders/Interactions/Buttons/PrayerReminderSetupButton',
};

const MENU_MODULES = {
    reciterMenu: '@modules/Audio/Interactions/Menus/ReciterSelectMenu',
    surahMenu: '@modules/Audio/Interactions/Menus/SurahSelectMenu',
    radioMenu: '@modules/Audio/Interactions/Menus/RadioSelectMenu',
    adminSelectGuildMenu: '@modules/Admin/Interactions/Menus/AdminSelectGuildMenu',
    lavalinkNodesMenu: '@modules/Audio/Interactions/Menus/LavalinkNodeSelectMenu',
    tafseerSurahSelectMenu: '@modules/Quran/Interactions/Menus/TafseerSurahSelectMenu',
    tafseerVerseSelectMenu: '@modules/Quran/Interactions/Menus/TafseerVerseSelectMenu',
    spreadBotChannelMenu: '@modules/Community/Interactions/Menus/SpreadBotChannelMenu',
    assignChannelsSelectMenu: '@modules/Admin/Interactions/Menus/AssignChannelsSelectMenu',
    prayerReminderSelectsMenu: '@modules/Prayer/Reminders/Interactions/Menus/PrayerReminderSelectMenu',
    adminStatusSelect: '@modules/Admin/Interactions/Menus/AdminStatusSelectMenu',
    countrySelect: '@modules/Prayer/Times/Interactions/Menus/CountrySelectMenu',
    citySelect: '@modules/Prayer/Times/Interactions/Menus/CitySelectMenu',
};

const MODAL_MODULES = {
    complaintModal: '@modules/Community/Interactions/Modals/ComplaintModal',
    adminResponseModal: '@modules/Admin/Interactions/Modals/AdminResponseModal',
    adminSendMessageModal: '@modules/Admin/Interactions/Modals/AdminSendMessageModal',
    adminStatusModal: '@modules/Admin/Interactions/Modals/AdminStatusModal',
};

for (const [name, modulePath] of Object.entries({ ...COMMAND_MODULES, ...BUTTON_MODULES, ...MENU_MODULES, ...MODAL_MODULES })) {
    Object.defineProperty(bindings, name, {
        enumerable: true,
        get() {
            return require(modulePath);
        },
    });
}

Object.defineProperty(bindings, 'incrementCommandStats', {
    enumerable: true,
    get() {
        return require('@infrastructure/Discord/Interactions/Processors/StatsProcessor').incrementCommandStats;
    },
});

Object.defineProperty(bindings, 'updateControlPanel', {
    enumerable: true,
    get() {
        return require('@infrastructure/Discord/UI/ControlPanel').updateControlPanel;
    },
});

Object.defineProperty(bindings, 'setupQuranCategory', {
    enumerable: true,
    get() {
        return require('@modules/Setup/Services/SetupQuranCategory').setupQuranCategory;
    },
});

Object.defineProperty(bindings, 'createPrayerTimesButtonRow', {
    enumerable: true,
    get() {
        return require('@infrastructure/Discord/UI/Components').createPrayerTimesButtonRow;
    },
});

global.setupQuranCategory = bindings.setupQuranCategory;
