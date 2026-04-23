require('pathlra-aliaser')();

const logger = require('@logger');
const { ChannelType } = require('discord.js');
const { loadSetupGuildsFromFirebase, saveSetupGuildsToFirebase } = require('@firebase-core_utils');

async function validateSetupData(guildId, setupData, guild) {
   let hasChanges = false;
   let valid = true;
   const cleanedData = { ...setupData };

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
            cleanedData.categoryId = existingCategory.id;
            hasChanges = true;
            logger.info('Guild ' + guildId + ' Fixed Category ID To ' + existingCategory.id);
         } else {
            valid = false;
            logger.info('Guild ' + guildId + ' Category Deleted And Not Found');
            return { valid: false, hasChanges: false, data: setupData };
         }
      }
   } else {
      valid = false;
      return { valid: false, hasChanges: false, data: setupData };
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
            cleanedData.voiceChannelId = existingVoice.id;
            hasChanges = true;
            logger.info('Guild ' + guildId + ' Fixed Voice Channel ID To ' + existingVoice.id);
         } else {
            delete cleanedData.voiceChannelId;
            hasChanges = true;
            logger.info('Guild ' + guildId + ' Voice Channel Deleted Removed From Data');
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
            cleanedData.textChannelId = existingText.id;
            hasChanges = true;
            logger.info('Guild ' + guildId + ' Fixed Text Channel ID To ' + existingText.id);
         } else {
            delete cleanedData.textChannelId;
            hasChanges = true;
            logger.info('Guild ' + guildId + ' Text Channel Deleted Removed From Data');
         }
      }
   }

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
            cleanedData.azkarChannelId = existingAzkar.id;
            hasChanges = true;
            logger.info('Guild ' + guildId + ' Fixed Azkar Channel ID To ' + existingAzkar.id);
         } else {
            delete cleanedData.azkarChannelId;
            hasChanges = true;
            logger.info('Guild ' + guildId + ' Azkar Channel Deleted Removed From Data');
         }
      }
   }

   if (setupData.guildName === 'Unknown' || !setupData.guildName) {
      cleanedData.guildName = guild.name;
      hasChanges = true;
   }

   return { valid: valid, hasChanges: hasChanges, data: cleanedData };
}

async function cleanSetupGuilds(client) {
   try {
      const setupGuilds = await loadSetupGuildsFromFirebase();
      if (!setupGuilds || Object.keys(setupGuilds).length === 0) {
         logger.info('No Setup Guilds Data To Clean');
         return { cleaned: 0, reason: 'No data' };
      }

      const botGuildIds = new Set(client.guilds.cache.keys());
      const validSetupGuilds = {};
      let removedCount = 0;
      let updatedCount = 0;

      for (const [guildId, setupData] of Object.entries(setupGuilds)) {
         if (!botGuildIds.has(guildId)) {
            removedCount++;
            logger.info('Removed Setup Guild Bot Not In: ' + guildId);
            continue;
         }

         const guild = client.guilds.cache.get(guildId);
         if (!guild) {
            removedCount++;
            logger.info('Removed Setup Guild Not Found In Cache: ' + guildId);
            continue;
         }

         const validatedData = await validateSetupData(guildId, setupData, guild);

         if (!validatedData.valid) {
            removedCount++;
            logger.info('Removed Setup Guild Invalid Category: ' + guildId);
            continue;
         }

         if (validatedData.hasChanges) {
            validSetupGuilds[guildId] = validatedData.data;
            updatedCount++;
            logger.info('Updated Setup Guild Removed Deleted Channels: ' + guildId);
         } else {
            validSetupGuilds[guildId] = setupData;
         }
      }

      if (removedCount > 0 || updatedCount > 0) {
         await saveSetupGuildsToFirebase(validSetupGuilds);
         logger.info('Saved Cleaned Setup Guilds: ' + Object.keys(validSetupGuilds).length);
      }

      return { cleaned: removedCount, updated: updatedCount, remaining: Object.keys(validSetupGuilds).length };
   } catch (error) {
      logger.error('Error Cleaning Setup Guilds', error);
      return { cleaned: 0, error: error.message };
   }
}

module.exports.validateSetupData = validateSetupData;
module.exports.cleanSetupGuilds = cleanSetupGuilds;
