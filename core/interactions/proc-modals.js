require('pathlra-aliaser')();
const imp = require('@loader-core_bootstrap');
const MODAL_HANDLERS = {
   complaint_modal: 'complaintModal',
   admin_response_modal_submit: 'adminResponseModal',
   admin_send_msg_modal: 'adminSendMessageModal',
   webhook_submit: 'webhookSubmitModal',
};
function isModalSubmit(interaction) {
   return interaction.isModalSubmit();
}
function getModalHandler(customId) {
   return MODAL_HANDLERS[customId] || null;
}
async function handleModalInteraction(interaction) {
   const customId = interaction.customId;
   const handlerName = getModalHandler(customId);
   if (!handlerName) {
      return false;
   }
   const handler = imp[handlerName];
   if (handler && typeof handler.execute === 'function') {
      await handler.execute(interaction);
      return true;
   }
   return false;
}
module.exports.isModalSubmit = isModalSubmit;
module.exports.getModalHandler = getModalHandler;
module.exports.handleModalInteraction = handleModalInteraction;
module.exports.MODAL_HANDLERS = MODAL_HANDLERS;
