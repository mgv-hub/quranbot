require('pathlra-aliaser')();
const imp = require('@loader-core_bootstrap');
const { handleInteractionError } = require('@interactionErrors-core_interactions');
const AZKAR_PREFIX = 'play_azkar_';
const PRAYER_BUTTONS = [
   'prayer_times',
   'home_prayer',
   'refresh_prayer',
   'back_country_prayer',
   'cancel_prayer',
];
const PRAYER_MENUS = ['select_country_prayer', 'select_city_prayer'];
function isAzkarInteraction(interaction) {
   const { customId } = interaction;
   return interaction.isButton() && customId.startsWith(AZKAR_PREFIX);
}
function isPrayerButtonInteraction(interaction) {
   if (!interaction.isButton()) return false;
   const { customId } = interaction;
   return (
      customId === 'prayer_times' ||
      customId.startsWith('prev_country_page_') ||
      customId.startsWith('next_country_page_') ||
      PRAYER_BUTTONS.includes(customId)
   );
}
function isPrayerMenuInteraction(interaction) {
   const { customId } = interaction;
   return interaction.isStringSelectMenu() && PRAYER_MENUS.includes(customId);
}
function isPublicFeature(interaction) {
   const { customId } = interaction;
   const isAzkar = interaction.isButton() && customId.startsWith(AZKAR_PREFIX);
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
      interaction.isStringSelectMenu() &&
      (customId === 'select_country_prayer' || customId === 'select_city_prayer');
   const isMoreFeatures = customId === 'more_features' || customId === 'back_to_main';
   return isAzkar || isPrayer || isPrayerMenu || isMoreFeatures;
}
async function handlePublicInteraction(interaction) {
   try {
      const { customId } = interaction;
      if (isPrayerButtonInteraction(interaction)) {
         if (customId === 'prayer_times') {
            await imp.prayerTimesButton.execute(interaction);
            return true;
         } else if (
            PRAYER_BUTTONS.includes(customId) ||
            customId.startsWith('prev_country_page_') ||
            customId.startsWith('next_country_page_')
         ) {
            await imp.prayerTimesNavigation.execute(interaction);
            return true;
         }
      }
      if (isPrayerMenuInteraction(interaction)) {
         if (customId === 'select_country_prayer') {
            await imp.countrySelect.execute(interaction);
            return true;
         } else if (customId === 'select_city_prayer') {
            await imp.citySelect.execute(interaction);
            return true;
         }
      }
      if (isAzkarInteraction(interaction)) {
         await imp.azkarAudioButton.execute(interaction);
         return true;
      }
      if (customId === 'more_features') {
         await imp.moreFeaturesButton.execute(interaction);
         return true;
      }
      if (customId === 'back_to_main') {
         await imp.backToMainButton.execute(interaction);
         return true;
      }
      return false;
   } catch (processingError) {
      await handleInteractionError(interaction, processingError, 'interactionProcessing');
      return true;
   }
}
module.exports.isAzkarInteraction = isAzkarInteraction;
module.exports.isPrayerButtonInteraction = isPrayerButtonInteraction;
module.exports.isPrayerMenuInteraction = isPrayerMenuInteraction;
module.exports.isPublicFeature = isPublicFeature;
module.exports.handlePublicInteraction = handlePublicInteraction;
