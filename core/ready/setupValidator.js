require('pathlra-aliaser');
const logger = require('@logger');
const { ChannelType } = require('discord.js');
const { saveSetupGuildsToFirebase } = require('@firebase-core_utils');

async function validateAndFixSetupData(guild, setupData) {
   const guildId = guild.id;
   let needsUpdate = false;
   let fixedData = { ...setupData };

   if (setupData.azkarChannelId) {
      let azkarChannel = guild.channels.cache.get(setupData.azkarChannelId);
      if (!azkarChannel) {
         azkarChannel = await guild.channels.fetch(setupData.azkarChannelId).catch(() => null);
      }
      if (!azkarChannel || !azkarChannel.isTextBased()) {
         const existingAzkar = guild.channels.cache.find(
            (c) => c.name === '🌙︱الأذكار' && c.type === ChannelType.GuildText,
         );
         if (existingAzkar) {
            fixedData.azkarChannelId = existingAzkar.id;
            needsUpdate = true;
            logger.info('Guild ' + guildId + ' Fixed Azkar Channel ID To ' + existingAzkar.id);
         } else {
            fixedData.azkarChannelId = null;
            needsUpdate = true;
            logger.warn('Guild ' + guildId + ' Azkar Channel Not Found Cleared ID');
         }
      }
   }

   if (setupData.voiceChannelId) {
      let voiceChannel = guild.channels.cache.get(setupData.voiceChannelId);
      if (!voiceChannel) {
         voiceChannel = await guild.channels.fetch(setupData.voiceChannelId).catch(() => null);
      }
      if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
         const existingVoice = guild.channels.cache.find(
            (c) => c.name === '🕌︱بثّ القُرآن الكريم' && c.type === ChannelType.GuildVoice,
         );
         if (existingVoice) {
            fixedData.voiceChannelId = existingVoice.id;
            needsUpdate = true;
            logger.info('Guild ' + guildId + ' Fixed Voice Channel ID To ' + existingVoice.id);
         } else {
            fixedData.voiceChannelId = null;
            needsUpdate = true;
            logger.warn('Guild ' + guildId + ' Voice Channel Not Found Cleared ID');
         }
      }
   }

   if (setupData.textChannelId) {
      let textChannel = guild.channels.cache.get(setupData.textChannelId);
      if (!textChannel) {
         textChannel = await guild.channels.fetch(setupData.textChannelId).catch(() => null);
      }
      if (!textChannel || !textChannel.isTextBased()) {
         const existingText = guild.channels.cache.find(
            (c) => c.name === '📖︱تحكم البوت القرآني' && c.type === ChannelType.GuildText,
         );
         if (existingText) {
            fixedData.textChannelId = existingText.id;
            needsUpdate = true;
            logger.info('Guild ' + guildId + ' Fixed Text Channel ID To ' + existingText.id);
         } else {
            fixedData.textChannelId = null;
            needsUpdate = true;
            logger.info('Guild ' + guildId + ' Text Channel Not Found Cleared ID');
         }
      }
   }

   if (setupData.categoryId) {
      let category = guild.channels.cache.get(setupData.categoryId);
      if (!category) {
         category = await guild.channels.fetch(setupData.categoryId).catch(() => null);
      }
      if (!category || category.type !== ChannelType.GuildCategory) {
         const existingCategory = guild.channels.cache.find(
            (c) => c.name === '🕋︱القُرآن الكريم' && c.type === ChannelType.GuildCategory,
         );
         if (existingCategory) {
            fixedData.categoryId = existingCategory.id;
            needsUpdate = true;
            logger.info('Guild ' + guildId + ' Fixed Category ID To ' + existingCategory.id);
         } else {
            fixedData.categoryId = null;
            needsUpdate = true;
            logger.warn('Guild ' + guildId + ' Category Not Found Cleared ID');
         }
      }
   }

   if (needsUpdate) {
      global.setupGuilds[guildId] = fixedData;
      await saveSetupGuildsToFirebase(global.setupGuilds);
      logger.info('Guild ' + guildId + ' Setup Data Updated In Firebase');
   }
   return fixedData;
}

module.exports.validateAndFixSetupData = validateAndFixSetupData;
