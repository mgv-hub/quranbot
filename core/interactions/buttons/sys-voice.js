require('pathlra-aliaser');

const { ChannelType, PermissionsBitField } = require('discord.js');
const logger = require('@logger');
const { CHANNEL_NAMES, ERRORS } = require('@sys-config-core_interactions_buttons');

async function getVoiceChannel(guild, setupData, state) {
   let voiceChannelId = null;

   if (setupData && setupData.voiceChannelId) {
      voiceChannelId = setupData.voiceChannelId;
   } else if (state.channelId) {
      voiceChannelId = state.channelId;
   }

   if (!voiceChannelId) {
      return { channel: null, error: ERRORS.NO_SETUP };
   }

   let voiceChannel = guild.channels.cache.get(voiceChannelId);
   if (!voiceChannel) {
      voiceChannel = await guild.channels.fetch(voiceChannelId).catch(() => null);
   }

   if (!voiceChannel) {
      const existingVoice = guild.channels.cache.find(
         (c) => c.name === CHANNEL_NAMES.VOICE && c.type === ChannelType.GuildVoice,
      );
      if (existingVoice) {
         voiceChannel = existingVoice;
         voiceChannelId = existingVoice.id;
         logger.info('Guild ' + guild.id + ' Auto Fixed Voice Channel ID To ' + voiceChannelId);
      }
   }

   if (!voiceChannel) {
      return { channel: null, error: ERRORS.NO_CHANNEL };
   }

   return { channel: voiceChannel, channelId: voiceChannelId };
}

function checkBotPermissions(channel, member) {
   const botPermissions = channel.permissionsFor(member);
   return botPermissions.has(PermissionsBitField.Flags.Connect);
}

module.exports.getVoiceChannel = getVoiceChannel;
module.exports.checkBotPermissions = checkBotPermissions;
