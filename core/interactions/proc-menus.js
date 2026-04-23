require('pathlra-aliaser')();
const imp = require('@loader-core_bootstrap');
const MENU_HANDLERS = {
   select_reciter: 'reciterMenu',
   select_surah: 'surahMenu',
   select_radio: 'radioMenu',
   admin_select_guild: 'adminSelectGuildMenu',
};
function isMenuInteraction(interaction) {
   return interaction.isStringSelectMenu();
}
function getMenuHandler(customId) {
   const handlerName = MENU_HANDLERS[customId];
   if (handlerName) return imp[handlerName];
   return null;
}
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
