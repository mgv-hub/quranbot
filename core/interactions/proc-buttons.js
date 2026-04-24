require('pathlra-aliaser')();
const imp = require('@loader-core_bootstrap');
const NAVIGATION_BUTTONS = [
   'prev_page',
   'next_page',
   'prev_reciter_page',
   'next_reciter_page',
];
const PLAYBACK_BUTTONS = ['prev', 'next', 'pause', 'resume'];
const RADIO_BUTTONS = ['toggle_radio', 'prev_radio_page', 'next_radio_page'];
const SYSTEM_BUTTONS = ['toggle_control_mode', 'join_vc', 'leave_vc'];
const ADMIN_SERVER_BUTTONS = [
   'admin_server_list',
   'admin_refresh_servers',
   'admin_back_to_servers',
];
const ADMIN_STATS_BUTTONS = ['admin_bot_stats', 'admin_refresh_stats'];
const ADMIN_VOICE_BUTTONS = [
   'admin_voice_channels',
   'admin_prev_voice',
   'admin_next_voice',
   'admin_refresh_voice',
];
function getButtonHandler(customId) {
   if (NAVIGATION_BUTTONS.includes(customId)) {
      return imp.navigationButtons;
   }
   if (PLAYBACK_BUTTONS.includes(customId)) {
      return imp.playbackButtons;
   }
   if (RADIO_BUTTONS.includes(customId)) {
      return imp.radioButtons;
   }
   if (SYSTEM_BUTTONS.includes(customId)) {
      return imp.systemButtons;
   }
   if (customId === 'submit_complaint') {
      return imp.complaintButton;
   }
   if (customId === 'open_complaint_modal') {
      return imp.openComplaintModalButton;
   }
   if (customId === 'admin_back_to_panel' || customId === 'admin_close_panel') {
      return imp.adminPanelButton;
   }
   if (ADMIN_SERVER_BUTTONS.includes(customId)) {
      return imp.adminServerListButton;
   }
   if (customId === 'admin_send_message') {
      return imp.adminSendMessageButton;
   }
   if (ADMIN_STATS_BUTTONS.includes(customId)) {
      return imp.adminBotStatsButton;
   }
   if (customId.startsWith('admin_kick_bot_')) {
      return imp.adminKickBotButton;
   }
   if (customId.startsWith('admin_confirm_kick_')) {
      return imp.adminConfirmKickButton;
   }
   if (customId === 'admin_response_modal') {
      return imp.adminResponseModalButton;
   }
   if (ADMIN_VOICE_BUTTONS.includes(customId)) {
      return imp.adminVoiceChannelsPagination;
   }
   if (customId === 'admin_prev_servers' || customId === 'admin_next_servers') {
      return imp.adminServerListPagination;
   }
   if (customId === 'more_features') {
      return imp.moreFeaturesButton;
   }
   if (customId === 'back_to_main') {
      return imp.backToMainButton;
   }
   return null;
}
async function handleButtonInteraction(interaction) {
   const customId = interaction.customId;
   const handler = getButtonHandler(customId);
   if (!handler) {
      if (customId === 'cancel_support' || customId === 'admin_cancel_kick') {
         await interaction.reply({
            content:
               customId === 'cancel_support'
                  ? 'تم إغلاق نافذة الدعم'
                  : 'تم إلغاء عملية الخروج',
            flags: 64,
         });
         return true;
      }
      return false;
   }
   if (typeof handler.execute === 'function') {
      await handler.execute(interaction);
      return true;
   }
   return false;
}
module.exports.handleButtonInteraction = handleButtonInteraction;
module.exports.getButtonHandler = getButtonHandler;
module.exports.NAVIGATION_BUTTONS = NAVIGATION_BUTTONS;
module.exports.PLAYBACK_BUTTONS = PLAYBACK_BUTTONS;
module.exports.RADIO_BUTTONS = RADIO_BUTTONS;
module.exports.SYSTEM_BUTTONS = SYSTEM_BUTTONS;
