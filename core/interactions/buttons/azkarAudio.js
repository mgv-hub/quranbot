require('pathlra-aliaser')();
const logger = require('@logger');
const { MessageFlags } = require('discord.js');
const { clean_Dhikr } = require('@azkarUtils-core_utils');
const AZKAR_EXPIRY_MS = 10 * 24 * 60 * 60 * 1000;
module.exports = {
   customId: 'azkar_audio',
   async execute(interaction) {
      try {
         await interaction.deferReply({ flags: MessageFlags.Ephemeral });
         await interaction.editReply({
            content: 'جاري تحميل الصوت يرجى الانتظار...',
            flags: MessageFlags.Ephemeral,
         });
         const customId = interaction.customId;
         let messageTimestamp = null;
         let extractedFilename = null;
         if (customId && customId.startsWith('play_azkar_')) {
            const parts = customId.split('_');
            const timestampPart = parts[parts.length - 1];
            if (timestampPart && !isNaN(timestampPart)) {
               messageTimestamp = parseInt(timestampPart, 10);
               extractedFilename = parts.slice(2, parts.length - 1).join('_');
            } else {
               extractedFilename = customId.replace('play_azkar_', '');
            }
         }
         const now = Date.now();
         if (messageTimestamp && now - messageTimestamp > AZKAR_EXPIRY_MS) {
            return interaction.editReply({
               content:
                  'عذراً هذا الذكر قديم جداً (أكثر من 10 أيام) لا يمكن تشغيل الصوت للرسائل القديمة',
               flags: MessageFlags.Ephemeral,
            });
         }
         let audioData = require('@AzkarManager-core_state').getAzkarAudioUrl(customId);
         let dhikrText = 'ذكر';
         let audioUrl = null;
         let filename = 'dhikr';
         if (!audioData || !audioData.url) {
            if (extractedFilename) {
               const azkarData = global.azkarData || [];
               let found = false;
               for (const category of azkarData) {
                  if (category.array && Array.isArray(category.array)) {
                     for (const dhikr of category.array) {
                        if (
                           dhikr.filename === extractedFilename ||
                           dhikr.audio?.includes(extractedFilename)
                        ) {
                           audioUrl = 'https://hub-mgv.github.io/QuranBotData/' + dhikr.audio;
                           filename = dhikr.filename || extractedFilename;
                           dhikrText = dhikr.text || 'ذكر';
                           found = true;
                           break;
                        }
                     }
                  }
                  if (found) break;
               }
            }
         } else {
            audioUrl = audioData.url;
            filename = audioData.filename || 'dhikr';
            const azkarData = global.azkarData || [];
            for (const category of azkarData) {
               if (category.array && Array.isArray(category.array)) {
                  for (const dhikr of category.array) {
                     if (dhikr.filename === filename || dhikr.audio?.includes(filename)) {
                        dhikrText = dhikr.text || 'ذكر';
                        break;
                     }
                  }
               }
               if (dhikrText !== 'ذكر') break;
            }
         }
         if (!audioUrl) {
            return interaction.editReply({
               content: 'عذرا رابط الصوت غير متوفر',
               flags: MessageFlags.Ephemeral,
            });
         }
         dhikrText = clean_Dhikr(dhikrText);
         if (dhikrText.length > 100) {
            dhikrText = dhikrText.substring(0, 97) + '...';
         }
         await interaction.followUp({
            content: `${dhikrText}`,
            files: [
               {
                  attachment: audioUrl,
                  name: `${filename}.mp3`,
               },
            ],
            flags: MessageFlags.Ephemeral,
         });
         await interaction.editReply({
            content: 'تم الإرسال',
            flags: MessageFlags.Ephemeral,
         });
      } catch (error) {
         logger.error('Error in azkarAudio button', error);
         try {
            await interaction.editReply({
               content: 'حدث خطأ أثناء تشغيل الصوت',
               flags: MessageFlags.Ephemeral,
            });
         } catch (replyError) {
            logger.error('Error replying to interaction', replyError);
         }
      }
   },
};
