require('pathlra-aliaser')();

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('@logger');
const { clean_Dhikr } = require('@azkarUtils-core_utils');
const {
   ADHKAR_BASE_URL,
   AZKAR_EXPIRY_MS,
   AZKAR_MAX_RETRY_ATTEMPTS,
   AZKAR_RETRY_DELAY_MS,
   REQUEST_TIMEOUT_MS,
   FALLBACK_AZKAR_DATA,
} = require('@azkar-config-core_state');
const {
   setAudioData,
   deleteAudioData,
   setMessageTimestamp,
   deleteMessageTimestamp,
} = require('@azkar-cache-core_state');

async function sendWithRetry(channel, content, maxRetries, guildId, channelId) {
   let lastError;
   for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
         const sentMessage = await channel.send(content);
         return { success: true, message: sentMessage };
      } catch (error) {
         lastError = error;
         if (error.code === 50013) {
            logger.info('Azkar Missing Permissions In Channel ' + channelId);
            break;
         }
         if (error.code === 429) {
            const retryAfter = (error.retry_after || 5) * 1000;
            await new Promise((resolve) => setTimeout(resolve, retryAfter));
            continue;
         }
         if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, AZKAR_RETRY_DELAY_MS * attempt));
         }
      }
   }
   logger.info('Azkar Send Failed In Guild ' + guildId + ' After ' + maxRetries + ' Attempts');
   return { success: false, error: lastError };
}

function trackAzkarMessage(messageId, timestamp) {
   setMessageTimestamp(messageId, timestamp);
   setTimeout(() => {
      deleteMessageTimestamp(messageId);
   }, AZKAR_EXPIRY_MS);
}

function trackAudioData(customId, data) {
   setAudioData(customId, data);
   setTimeout(() => {
      deleteAudioData(customId);
   }, 10000);
}

async function incrementAzkarStat() {
   try {
      const { incrementStat } = require('@StatisticsTracker-core_statistics');
      if (incrementStat && typeof incrementStat === 'function') {
         incrementStat('azkarSent', 1);
      }
   } catch (statError) {
      logger.debug('Statistics tracking not available for azkar');
   }
}

async function sendImageAzkar(channel, imageUrl, messageTimestamp, guildId, maxRetries, channelId) {
   try {
      const response = await fetch(imageUrl, {
         headers: { 'User-Agent': 'QuranBot/1.0' },
         timeout: REQUEST_TIMEOUT_MS,
      });
      if (!response.ok) {
         return { success: false, reason: 'HTTP ' + response.status };
      }
      const imageEmbed = new EmbedBuilder().setColor(0x1e1f22).setImage(imageUrl);
      const result = await sendWithRetry(channel, { embeds: [imageEmbed] }, maxRetries, guildId, channelId);
      if (result.success) {
         trackAzkarMessage(result.message.id, messageTimestamp);
         await incrementAzkarStat();
      }
      return result;
   } catch (error) {
      logger.warn('Failed to load adhkar image ' + error.message);
      return { success: false, reason: error.message };
   }
}

async function sendAudioAzkar(channel, randomDhikr, cleanedText, messageTimestamp, guildId, maxRetries, channelId) {
   if (!randomDhikr.audio) {
      return { success: false, reason: 'No audio available' };
   }
   const audioUrl = ADHKAR_BASE_URL + randomDhikr.audio;
   const stableId = randomDhikr.filename || 'dhikr_' + randomDhikr.id;
   const customId = 'play_azkar_' + stableId + '_' + messageTimestamp;
   const audioButton = new ButtonBuilder().setCustomId(customId).setLabel('استماع').setStyle(ButtonStyle.Secondary);
   const components = [new ActionRowBuilder().addComponents(audioButton)];
   trackAudioData(customId, {
      url: audioUrl,
      filename: stableId,
      timestamp: messageTimestamp,
   });
   const embed = new EmbedBuilder()
      .setColor(0x1e1f22)
      .setTitle('🕋 ذكر')
      .setDescription(
         cleanedText +
            '\n\n' +
            '> **ملاحظة**\n' +
            'للاستماع إلى الذكر بطريقة أوضح وأدق، يُرجى الضغط على زر **استماع**.\n' +
            'وقد يساعد ذلك على فهم الذكر وقراءته بالشكل الصحيح.',
      );
   const result = await sendWithRetry(
      channel,
      { embeds: [embed], components: components },
      maxRetries,
      guildId,
      channelId,
   );
   if (result.success) {
      trackAzkarMessage(result.message.id, messageTimestamp);
      await incrementAzkarStat();
   }
   return result;
}

async function sendCategoryAudioAzkar(
   channel,
   randomCategory,
   cleanedText,
   messageTimestamp,
   guildId,
   maxRetries,
   channelId,
) {
   if (!randomCategory.audio) {
      return { success: false, reason: 'No category audio available' };
   }
   const categoryAudioUrl = ADHKAR_BASE_URL + randomCategory.audio;
   const stableId = randomCategory.filename || 'category_' + randomCategory.id;
   const customId = 'play_azkar_category_' + stableId + '_' + messageTimestamp;
   const categoryAudioButton = new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('استماع للقسم')
      .setStyle(ButtonStyle.Secondary);
   const components = [new ActionRowBuilder().addComponents(categoryAudioButton)];
   trackAudioData(customId, {
      url: categoryAudioUrl,
      filename: stableId,
      timestamp: messageTimestamp,
   });
   const embed = new EmbedBuilder()
      .setColor(0x1e1f22)
      .setTitle('🕋 ذكر')
      .setDescription(
         cleanedText +
            '\n\n' +
            '> **ملاحظة**\n' +
            'للاستماع إلى الذكر بطريقة أوضح وأدق، يُرجى الضغط على زر **استماع**.\n' +
            'وقد يساعد ذلك على فهم الذكر وقراءته بالشكل الصحيح.',
      );
   const result = await sendWithRetry(
      channel,
      { embeds: [embed], components: components },
      maxRetries,
      guildId,
      channelId,
   );
   if (result.success) {
      trackAzkarMessage(result.message.id, messageTimestamp);
      await incrementAzkarStat();
   }
   return result;
}

async function sendRandomAzkar(channelId, guildId, maxRetries = AZKAR_MAX_RETRY_ATTEMPTS, forceImage = false) {
   const channel =
      global.client.channels.cache.get(channelId) || (await global.client.channels.fetch(channelId).catch(() => null));
   if (!channel || !channel.isTextBased?.()) {
      logger.info('Azkar Channel Not Found Or Invalid ' + channelId);
      const state = global.guildStates.get(guildId);
      if (state) {
         state.azkarChannelId = null;
         if (state.azkarTimer) {
            clearInterval(state.azkarTimer);
            state.azkarTimer = null;
         }
      }
      return { success: false, reason: 'Channel not found or invalid' };
   }
   let azkarData = global.azkarData || [];
   if (!Array.isArray(azkarData) || azkarData.length === 0) {
      logger.warn('Azkar No Data For Guild ' + guildId + ' Using Fallback');
      azkarData = FALLBACK_AZKAR_DATA;
   }
   const randomCategory = azkarData[Math.floor(Math.random() * azkarData.length)];
   if (!randomCategory || !randomCategory.array || randomCategory.array.length === 0) {
      return { success: false, reason: 'No valid azkar category' };
   }
   const randomDhikr = randomCategory.array[Math.floor(Math.random() * randomCategory.array.length)];
   if (!randomDhikr) {
      return { success: false, reason: 'No valid dhikr' };
   }
   const messageTimestamp = Date.now();
   const cleanedText = clean_Dhikr(randomDhikr.text || 'لا يوجد');
   const shouldSendImage = forceImage || (global.azkarImages && global.azkarImages.length > 0 && Math.random() > 0.5);
   if (shouldSendImage && global.azkarImages && global.azkarImages.length > 0) {
      const randomImageIndex = Math.floor(Math.random() * global.azkarImages.length);
      const imageUrl = global.azkarImages[randomImageIndex];
      const imageResult = await sendImageAzkar(channel, imageUrl, messageTimestamp, guildId, maxRetries, channelId);
      if (imageResult.success) {
         return { success: true, type: 'image' };
      }
   }
   if (randomDhikr.audio) {
      const audioResult = await sendAudioAzkar(
         channel,
         randomDhikr,
         cleanedText,
         messageTimestamp,
         guildId,
         maxRetries,
         channelId,
      );
      if (audioResult.success) {
         return { success: true, type: 'audio' };
      }
   }
   if (randomCategory.audio && !randomDhikr.audio) {
      const categoryResult = await sendCategoryAudioAzkar(
         channel,
         randomCategory,
         cleanedText,
         messageTimestamp,
         guildId,
         maxRetries,
         channelId,
      );
      if (categoryResult.success) {
         return { success: true, type: 'category_audio' };
      }
   }
   return { success: false, reason: 'All send methods failed' };
}

module.exports.sendRandomAzkar = sendRandomAzkar;
module.exports.sendWithRetry = sendWithRetry;
module.exports.trackAzkarMessage = trackAzkarMessage;
module.exports.trackAudioData = trackAudioData;
