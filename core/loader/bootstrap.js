require('pathlra-aliaser')();

const pingCommand = require('@ping-core_commands');
const joinCommand = require('@join-core_commands');
const joinChannelCommand = require('@join_channel-core_commands');
const leaveCommand = require('@leave-core_commands');
const controlCommand = require('@control-core_commands');
const setupCommand = require('@setup-core_commands');
const guideCommand = require('@guide-core_commands');
const prayerTimesCommand = require('@prayerTimes-core_commands');
const sourcesCommand = require('@sources-core_commands');

const navigationButtons = require('@navigation-core_interactions_buttons');
const playbackButtons = require('@playback-core_interactions_buttons');
const radioButtons = require('@radio-core_interactions_buttons');
const systemButtons = require('@system-core_interactions_buttons');
const complaintButton = require('@complaint-core_interactions_buttons');
const openComplaintModalButton = require('@openComplaintModal-core_interactions_buttons');
const prayerTimesButton = require('@prayerTimes-core_interactions_buttons');
const prayerTimesNavigation = require('@prayerTimesNavigation-core_interactions_buttons');

const reciterMenu = require('@reciter-core_interactions_menus');
const surahMenu = require('@surah-core_interactions_menus');
const radioMenu = require('@radio-core_interactions_menus');
const countrySelect = require('@countrySelect-core_interactions_menus');
const adminVoiceChannelsPagination = require('@adminVoiceChannelsPagination-core_interactions_buttons');
const adminServerListPagination = require('@adminServerListPagination-core_interactions_buttons');
const citySelect = require('@citySelect-core_interactions_menus');

const moreFeaturesButton = require('@moreFeatures-core_interactions_buttons');
const backToMainButton = require('@backToMain-core_interactions_buttons');

const complaintModal = require('@complaintModal-core_interactions_modals');
const adminResponseModal = require('@adminResponseModal-core_interactions_modals');
const azkarAudioButton = require('@azkarAudio-core_interactions_buttons');
const adminPanelButton = require('@adminPanel-core_interactions_buttons');
const adminResponseModalButton = require('@adminResponseModalButton-core_interactions_buttons');
const adminVoiceChannelsButton = require('@adminVoiceChannels-core_interactions_buttons');
const adminServerListButton = require('@adminServerList-core_interactions_buttons');
const adminSendMessageButton = require('@adminSendMessage-core_interactions_buttons');
const adminKickBotButton = require('@adminKickBot-core_interactions_buttons');
const adminConfirmKickButton = require('@adminConfirmKick-core_interactions_buttons');
const adminBotStatsButton = require('@adminBotStats-core_interactions_buttons');
const adminSelectGuildMenu = require('@adminSelectGuild-core_interactions_menus');
const adminSendMessageModal = require('@adminSendMessageModal-core_interactions_modals');
const { updateControlPanel } = require('@controlPanel-core_ui');
const { createControlEmbed } = require('@embeds-core_ui');
const {
   createReciterRow,
   createRadioRow,
   createSelectRow,
   createButtonRow,
   createNavigationRow,
   createMoreFeaturesRow,
   createPrayerTimesButtonRow,
} = require('@components-core_ui');

const {
   getGuildState,
   removeGuildState,
   isAuthorized,
   updatePersistentState,
   canJoinVoice,
   incrementVoiceConnections,
   decrementVoiceConnections,
} = require('@GuildStateManager-core_state');

const {
   checkRateLimit,
   COOLDOWN_TYPES,
   isUserInGlobalCooldown,
} = require('@cooldown-core_state');

const {
   saveControlId,
   readControlIds,
   removeControlId,
   saveDhikrMessageId,
} = require('@controlIds-core_utils');

const { updateControlMessage } = require('@interaction-core_utils');

const {
   createSurahResource,
   createRadioResource,
   getCurrentLinks,
   getCurrentDurations,
} = require('@audioUtils-core_utils');

const { registerCommands, applyCommandPermissions } = require('@CommandUtils-core_utils');

const { sendRandomAzkar, startAzkarTimerForGuild } = require('@AzkarManager-core_state');

const {
   EmbedBuilder,
   ChannelType,
   PermissionsBitField,
   MessageFlags,
   ModalBuilder,
   TextInputBuilder,
   TextInputStyle,
   ActionRowBuilder,
   ModalSubmitInteraction,
   ActivityType,
} = require('discord.js');

const {
   joinVoiceChannel,
   createAudioPlayer,
   entersState,
   VoiceConnectionStatus,
   AudioPlayerStatus,
} = require('@discordjs/voice');

const logger = require('@logger');
const fs = require('fs').promises;
const pathlra = require('path');
const fetch = require('node-fetch').default;
const persistentStateManager = require('@PersistentStateManager-core_state');

const {
   checkUserCooldown,
   setUserCooldown,
   checkServerCooldown,
   setServerCooldown,
   checkCooldown,
   setCooldown,
   getCooldownResponse,
   COMMAND_COOLDOWNS,
   COMMAND_NAME_MAP,
} = require('@commandCooldown-core_utils');

const {
   incrementCommandStats,
   getStatisticsTracker,
} = require('@proc-stats-core_interactions');

module.exports.pingCommand = pingCommand;
module.exports.joinCommand = joinCommand;
module.exports.joinChannelCommand = joinChannelCommand;
module.exports.leaveCommand = leaveCommand;
module.exports.controlCommand = controlCommand;
module.exports.setupCommand = setupCommand;
module.exports.guideCommand = guideCommand;
module.exports.prayerTimesCommand = prayerTimesCommand;
module.exports.sourcesCommand = sourcesCommand;

module.exports.navigationButtons = navigationButtons;
module.exports.playbackButtons = playbackButtons;
module.exports.radioButtons = radioButtons;
module.exports.systemButtons = systemButtons;
module.exports.complaintButton = complaintButton;
module.exports.openComplaintModalButton = openComplaintModalButton;
module.exports.prayerTimesButton = prayerTimesButton;
module.exports.prayerTimesNavigation = prayerTimesNavigation;

module.exports.reciterMenu = reciterMenu;
module.exports.surahMenu = surahMenu;
module.exports.radioMenu = radioMenu;
module.exports.countrySelect = countrySelect;
module.exports.citySelect = citySelect;

module.exports.complaintModal = complaintModal;
module.exports.adminResponseModal = adminResponseModal;
module.exports.adminPanelButton = adminPanelButton;
module.exports.adminServerListButton = adminServerListButton;
module.exports.adminSendMessageButton = adminSendMessageButton;
module.exports.adminKickBotButton = adminKickBotButton;
module.exports.adminConfirmKickButton = adminConfirmKickButton;
module.exports.adminBotStatsButton = adminBotStatsButton;
module.exports.adminSelectGuildMenu = adminSelectGuildMenu;
module.exports.adminSendMessageModal = adminSendMessageModal;

module.exports.updateControlPanel = updateControlPanel;
module.exports.createControlEmbed = createControlEmbed;
module.exports.createReciterRow = createReciterRow;
module.exports.createRadioRow = createRadioRow;
module.exports.createSelectRow = createSelectRow;
module.exports.createButtonRow = createButtonRow;
module.exports.createNavigationRow = createNavigationRow;
module.exports.createPrayerTimesButtonRow = createPrayerTimesButtonRow;

module.exports.getGuildState = getGuildState;
module.exports.removeGuildState = removeGuildState;
module.exports.isAuthorized = isAuthorized;

module.exports.checkRateLimit = checkRateLimit;
module.exports.COOLDOWN_TYPES = COOLDOWN_TYPES;
module.exports.isUserInGlobalCooldown = isUserInGlobalCooldown;

module.exports.checkCooldown = checkCooldown;
module.exports.setCooldown = setCooldown;
module.exports.getCooldownResponse = getCooldownResponse;
module.exports.COMMAND_COOLDOWNS = COMMAND_COOLDOWNS;
module.exports.COMMAND_NAME_MAP = COMMAND_NAME_MAP;

module.exports.saveControlId = saveControlId;
module.exports.readControlIds = readControlIds;
module.exports.removeControlId = removeControlId;
module.exports.saveDhikrMessageId = saveDhikrMessageId;
module.exports.updateControlMessage = updateControlMessage;
module.exports.createSurahResource = createSurahResource;
module.exports.createRadioResource = createRadioResource;
module.exports.getCurrentLinks = getCurrentLinks;
module.exports.getCurrentDurations = getCurrentDurations;

module.exports.registerCommands = registerCommands;
module.exports.applyCommandPermissions = applyCommandPermissions;

module.exports.sendRandomAzkar = sendRandomAzkar;
module.exports.startAzkarTimerForGuild = startAzkarTimerForGuild;

module.exports.EmbedBuilder = EmbedBuilder;
module.exports.ChannelType = ChannelType;
module.exports.PermissionsBitField = PermissionsBitField;
module.exports.MessageFlags = MessageFlags;
module.exports.ModalBuilder = ModalBuilder;
module.exports.TextInputBuilder = TextInputBuilder;
module.exports.TextInputStyle = TextInputStyle;
module.exports.ActionRowBuilder = ActionRowBuilder;
module.exports.ModalSubmitInteraction = ModalSubmitInteraction;
module.exports.ActivityType = ActivityType;

module.exports.joinVoiceChannel = joinVoiceChannel;
module.exports.createAudioPlayer = createAudioPlayer;
module.exports.entersState = entersState;
module.exports.VoiceConnectionStatus = VoiceConnectionStatus;
module.exports.AudioPlayerStatus = AudioPlayerStatus;
module.exports.createMoreFeaturesRow = createMoreFeaturesRow;
module.exports.logger = logger;
module.exports.fs = fs;
module.exports.pathlra = pathlra;
module.exports.fetch = fetch;
module.exports.persistentStateManager = persistentStateManager;

module.exports.updatePersistentState = updatePersistentState;
module.exports.azkarAudioButton = azkarAudioButton;
module.exports.canJoinVoice = canJoinVoice;
module.exports.incrementVoiceConnections = incrementVoiceConnections;
module.exports.decrementVoiceConnections = decrementVoiceConnections;
module.exports.adminResponseModalButton = adminResponseModalButton;
module.exports.adminVoiceChannelsButton = adminVoiceChannelsButton;
module.exports.adminVoiceChannelsPagination = adminVoiceChannelsPagination;
module.exports.adminServerListPagination = adminServerListPagination;
module.exports.incrementCommandStats = incrementCommandStats;
module.exports.getStatisticsTracker = getStatisticsTracker;
module.exports.moreFeaturesButton = moreFeaturesButton;
module.exports.backToMainButton = backToMainButton;
