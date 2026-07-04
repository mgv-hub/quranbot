const coreLoader = require('@bot/bootstrap');
const { handleInteractionError } = require('@interactions/interactionErrors');
const azkar_prefix = 'play_azkar_';
const tasbih_prefix = 'tasbih_';
const prayer_buttons = ['prayer_times', 'home_prayer', 'refresh_prayer', 'back_country_prayer', 'cancel_prayer'];
const prayer_menus = ['select_country_prayer', 'select_city_prayer'];
function isAzkarInteraction(interaction) {
    const { customId } = interaction;
    return interaction.isButton() && customId.startsWith(azkar_prefix);
}

function isTasbihInteraction(interaction) {
    const { customId } = interaction;
    return interaction.isButton() && customId.startsWith(tasbih_prefix);
}

function isPrayerButtonInteraction(interaction) {
    if (!interaction.isButton()) return false;
    const { customId } = interaction;
    return (
        customId === 'prayer_times' ||
        customId.startsWith('prev_country_page_') ||
        customId.startsWith('next_country_page_') ||
        prayer_buttons.includes(customId)
    );
}

function isPrayerMenuInteraction(interaction) {
    const { customId } = interaction;
    return interaction.isStringSelectMenu() && prayer_menus.includes(customId);
}

function isPublicFeature(interaction) {
    const { customId } = interaction;

    const isAzkar = interaction.isButton() && customId.startsWith(azkar_prefix);

    const isPrayer =
        interaction.isButton() &&
        (customId === 'prayer_times' ||
            customId.startsWith('prev_country_page_') ||
            customId.startsWith('next_country_page_') ||
            customId === 'home_prayer' ||
            customId === 'refresh_prayer' ||
            customId === 'back_country_prayer' ||
            customId === 'cancel_prayer');

    const isPrayerMenu = interaction.isStringSelectMenu() && (customId === 'select_country_prayer' || customId === 'select_city_prayer');

    const isMoreFeatures = customId === 'more_features' || customId === 'back_to_main';
    const isTasbih = isTasbihInteraction(interaction);
    return isAzkar || isPrayer || isPrayerMenu || isMoreFeatures || isTasbih;
}

// Handle public feature interactions with error recovery
async function handlePublicInteraction(interaction) {
    try {
        const { customId } = interaction;

        // Route prayer times button interactions
        if (isPrayerButtonInteraction(interaction)) {
            if (customId === 'prayer_times') {
                await coreLoader.prayerTimesButton.execute(interaction);
                return true;
            } else if (
                prayer_buttons.includes(customId) ||
                customId.startsWith('prev_country_page_') ||
                customId.startsWith('next_country_page_')
            ) {
                await coreLoader.prayerTimesNavigation.execute(interaction);
                return true;
            }
        }

        // Route prayer times menu interactions
        if (isPrayerMenuInteraction(interaction)) {
            if (customId === 'select_country_prayer') {
                await coreLoader.countrySelect.execute(interaction);
                return true;
            } else if (customId === 'select_city_prayer') {
                await coreLoader.citySelect.execute(interaction);
                return true;
            }
        }

        // Route azkar audio playback interactions
        if (isAzkarInteraction(interaction)) {
            await coreLoader.azkarAudioButton.execute(interaction);
            return true;
        }
        if (isTasbihInteraction(interaction)) {
            await coreLoader.tasbihCounterButton.execute(interaction);
            return true;
        }

        if (customId === 'azkar_get_role') {
            await coreLoader.azkarSettingsButton.execute(interaction);
            return true;
        }
        if (customId === 'more_features') {
            await coreLoader.moreFeaturesButton.execute(interaction);
            return true;
        }
        if (customId === 'back_to_main') {
            await coreLoader.backToMainButton.execute(interaction);
            return true;
        }

        return false;
    } catch (processingError) {
        await handleInteractionError(interaction, processingError, 'interactionProcessing');
        return true;
    }
}

module.exports.isAzkarInteraction = isAzkarInteraction;
module.exports.isTasbihInteraction = isTasbihInteraction;
module.exports.isPrayerButtonInteraction = isPrayerButtonInteraction;
module.exports.isPrayerMenuInteraction = isPrayerMenuInteraction;
module.exports.isPublicFeature = isPublicFeature;
module.exports.handlePublicInteraction = handlePublicInteraction;
