const v = require('@modules/Audio/Playback/AudioValidation');

module.exports.isBotInVoice = v.isBotInVoice;
module.exports.isAllowedWithoutVoice = v.isAllowedWithoutVoice;
module.exports.checkVoiceState = v.requireVoiceChannel;
module.exports.allowed_when_not_in_voice = v.allowed_when_not_in_voice;
