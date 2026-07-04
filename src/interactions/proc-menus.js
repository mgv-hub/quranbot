const coreLoader = require('@bot/bootstrap');

const MENU_HANDLERS = {
    select_reciter: 'reciterMenu',
    select_surah: 'surahMenu',
    select_radio: 'radioMenu',
    admin_select_guild: 'adminSelectGuildMenu',
    select_lavalink_node: 'lavalinkNodesMenu',
    tafseer_surah_select: 'tafseerSurahSelectMenu',
    tafseer_verse_select: 'tafseerVerseSelectMenu',
    spread_bot_channel: 'spreadBotChannelMenu',
    assign_select_category: 'assignChannelsSelectMenu',
    assign_select_text: 'assignChannelsSelectMenu',
    assign_select_azkar: 'assignChannelsSelectMenu',
    assign_select_voice: 'assignChannelsSelectMenu',
};

function isMenuInteraction(interaction) {
    return (
        interaction.isStringSelectMenu() ||
        interaction.isChannelSelectMenu() ||
        interaction.isRoleSelectMenu() ||
        interaction.isUserSelectMenu() ||
        interaction.isMentionableSelectMenu()
    );
}

function getMenuHandler(customId) {
    const handlerName = MENU_HANDLERS[customId];
    if (handlerName) return coreLoader[handlerName];
    return null;
}

// Route menu interactions to their appropriate handlers
async function handleMenuInteraction(interaction) {
    if (!isMenuInteraction(interaction)) return false;

    const { customId } = interaction;
    const handler = getMenuHandler(customId);

    if (handler && typeof handler.execute === 'function') {
        await handler.execute(interaction);
        return true;
    }

    return false;
}

module.exports.handleMenuInteraction = handleMenuInteraction;
module.exports.isMenuInteraction = isMenuInteraction;
module.exports.getMenuHandler = getMenuHandler;
module.exports.MENU_HANDLERS = MENU_HANDLERS;
