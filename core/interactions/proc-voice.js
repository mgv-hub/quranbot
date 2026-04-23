require('pathlra-aliaser')();

const ALLOWED_WHEN_NOT_IN_VOICE = [
   'join_vc',
   'leave_vc',
   'submit_complaint',
   'open_complaint_modal',
   'cancel_support',
   'more_features',
   'back_to_main',
   'webhook_azkar_info',
   'check_hafsat',
   'stop_webhook',
   'register_webhook',
];

function isBotInVoice(state) {
   return state?.connection && !state.connection.destroyed && state.channelId;
}

function isAllowedWithoutVoice(interactionType) {
   return ALLOWED_WHEN_NOT_IN_VOICE.includes(interactionType);
}

async function checkVoiceState(interaction, state, interactionType) {
   const isActuallyInVoice = isBotInVoice(state);
   if (!isActuallyInVoice && !isAllowedWithoutVoice(interactionType)) {
      await interaction.deferUpdate().catch(() => {});
      await interaction
         .followUp({
            content:
               'البوت غير موجود في غرفة صوتية حالياً. يجب الضغط على زر دخول أولاً للانضمام إلى الغرفة الصوتية قبل استخدام أي ميزة أخرى',
            flags: 64,
         })
         .catch(() => {});
      return false;
   }
   return true;
}

module.exports.isBotInVoice = isBotInVoice;
module.exports.isAllowedWithoutVoice = isAllowedWithoutVoice;
module.exports.checkVoiceState = checkVoiceState;
module.exports.ALLOWED_WHEN_NOT_IN_VOICE = ALLOWED_WHEN_NOT_IN_VOICE;
