require('pathlra-aliaser')();
const imp = require('@loader-core_bootstrap');
const EXCLUDED_FROM_AUTH = ['submit_complaint', 'open_complaint_modal', 'cancel_support'];
function isExcludedFromAuth(interactionType) {
   return EXCLUDED_FROM_AUTH.includes(interactionType);
}
function isPublicFeature(interaction) {
   const { customId } = interaction;
   const isAzkar = interaction.isButton() && customId.startsWith('play_azkar_');
   const isPrayer =
      interaction.isButton() &&
      (customId === 'prayer_times' ||
         customId.startsWith('prev_country_page_') ||
         customId.startsWith('next_country_page_') ||
         customId === 'home_prayer' ||
         customId === 'refresh_prayer' ||
         customId === 'back_country_prayer' ||
         customId === 'cancel_prayer');
   const isPrayerMenu =
      interaction.isStringSelectMenu() && (customId === 'select_country_prayer' || customId === 'select_city_prayer');
   const isMoreFeatures = customId === 'more_features' || customId === 'back_to_main';
   return isAzkar || isPrayer || isPrayerMenu || isMoreFeatures;
}
async function checkAuthorization(interaction, state, interactionType) {
   if (isPublicFeature(interaction) || isExcludedFromAuth(interactionType)) {
      return true;
   }
   const isAuthorizedUser = imp.isAuthorized(interaction, state, interactionType);
   if (!isAuthorizedUser) {
      await interaction.deferUpdate().catch(() => {});
      const permissionMessage =
         state.controlMode === 'everyone'
            ? 'هذا الإجراء غير متاح للأعضاء العاديين في وضع الجميع فقط التنقل بين السور واختيار القارئ متاح مع تأخير 90 ثانية الأدمنز لديهم تحكم كامل'
            : 'يجب أن تمتلك صلاحية المشرف للقيام بهذا الإجراء';
      await interaction
         .followUp({
            content: permissionMessage,
            flags: 64,
         })
         .catch(() => {});
      return false;
   }
   return true;
}
module.exports.checkAuthorization = checkAuthorization;
module.exports.isExcludedFromAuth = isExcludedFromAuth;
module.exports.isPublicFeature = isPublicFeature;
module.exports.EXCLUDED_FROM_AUTH = EXCLUDED_FROM_AUTH;
