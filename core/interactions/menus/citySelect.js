require('pathlra-aliaser')();
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');
const logger = require('@logger');
const fetch = require('node-fetch').default;
const { getCitiesForCountry, getTimeFormatForCountry } = require('@prayerTimesData-core_utils');
const { getBrowserHeaders, getTimeoutForRequest } = require('@httpConfig-core_utils');
function formatTime(time24, countryCode) {
   if (!time24 || typeof time24 !== 'string') return 'غير متاح';
   const timeFormat = getTimeFormatForCountry(countryCode);
   const parts = time24.split(':');
   if (parts.length < 2) return time24;
   let hours = parseInt(parts[0], 10);
   const minutes = parts[1];
   if (timeFormat === '24') {
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
   } else {
      const ampm = hours >= 12 ? 'م' : 'ص';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hoursStr = hours.toString().padStart(2, '0');
      const minutesStr = minutes.toString().padStart(2, '0');
      return `${hoursStr}:${minutesStr} ${ampm}`;
   }
}
async function fetchPrayerTimes(lat, lng, cityName, countryCode) {
   try {
      const date = new Date();
      const timestamp = Math.floor(date.getTime() / 1000);
      let method = 2;
      if (countryCode === 'EG') {
         method = 5;
      } else if (countryCode === 'SA') {
         method = 4;
      } else if (countryCode === 'KW' || countryCode === 'QA' || countryCode === 'BH') {
         method = 3;
      } else if (countryCode === 'AE') {
         method = 1;
      }
      const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lng}&method=${method}`;
      const response = await fetch(url, {
         headers: getBrowserHeaders(),
         timeout: getTimeoutForRequest('default'),
      });
      if (!response.ok) {
         throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const timings = data.data.timings;
      const hijri = data.data.date.hijri;
      const gregorian = data.data.date.gregorian;
      return {
         fajr: formatTime(timings.Fajr, countryCode),
         sunrise: formatTime(timings.Sunrise, countryCode),
         dhuhr: formatTime(timings.Dhuhr, countryCode),
         asr: formatTime(timings.Asr, countryCode),
         maghrib: formatTime(timings.Maghrib, countryCode),
         isha: formatTime(timings.Isha, countryCode),
         hijriDate: `${hijri.day} ${hijri.month.ar} ${hijri.year}`,
         gregorianDate: `${gregorian.day} ${gregorian.month.en} ${gregorian.year}`,
         cityName: cityName,
         countryCode: countryCode,
         method: method,
      };
   } catch (error) {
      logger.error('Error fetching prayer times', error);
      return null;
   }
}
module.exports = {
   customId: 'select_city_prayer',
   async execute(interaction) {
      try {
         await interaction.deferUpdate();
         const selectedValue = interaction.values[0];
         const parts = selectedValue.split('_');
         const countryCode = parts[0];
         const cityIndex = parseInt(parts[1]);
         const cities = getCitiesForCountry(countryCode);
         const city = cities[cityIndex];
         if (!city) {
            return interaction.editReply({
               content: 'المدينة غير متاحة',
               flags: 64,
            });
         }
         await interaction.editReply({
            embeds: [
               {
                  color: 0x1e1f22,
                  title: 'جاري تحميل مواقيت الصلاة',
                  description: `المدينة: ${city.name}
يرجى الانتظار...`,
               },
            ],
            components: [],
            flags: MessageFlags.Ephemeral,
         });
         const prayerData = await fetchPrayerTimes(city.lat, city.lng, city.name, countryCode);
         if (!prayerData) {
            return interaction.editReply({
               content: 'فشل في جلب مواقيت الصلاة. يرجى المحاولة لاحقاً',
               flags: 64,
            });
         }
         const embed = new EmbedBuilder()
            .setColor(0x1e1f22)
            .setTitle('مواقيت الصلاة')
            .setDescription(`**${prayerData.cityName} - ${prayerData.countryCode}**`)
            .addFields(
               { name: 'الفجر', value: prayerData.fajr, inline: true },
               { name: 'الشروق', value: prayerData.sunrise, inline: true },
               { name: 'الظهر', value: prayerData.dhuhr, inline: true },
               { name: 'العصر', value: prayerData.asr, inline: true },
               { name: 'المغرب', value: prayerData.maghrib, inline: true },
               { name: 'العشاء', value: prayerData.isha, inline: true },
               {
                  name: 'التاريخ الهجري',
                  value: prayerData.hijriDate,
                  inline: false,
               },
               {
                  name: 'التاريخ الميلادي',
                  value: prayerData.gregorianDate,
                  inline: false,
               },
            )
            .setFooter({
               text: `تحذير: هذه المعلومات من api.aladhan.com - يرجى التحقق من الموقع الرسمي لمواقيت الصلاة في بلدك للمواعيد الدقيقة المصدر https://aladhan.com/prayer-times`,
            });
         const homeButton = new ButtonBuilder()
            .setCustomId('home_prayer')
            .setLabel('الرئيسية')
            .setStyle(ButtonStyle.Secondary);
         const refreshButton = new ButtonBuilder()
            .setCustomId('refresh_prayer')
            .setLabel('تحديث')
            .setStyle(ButtonStyle.Secondary);
         const row = new ActionRowBuilder().addComponents(homeButton, refreshButton);
         await interaction.editReply({
            embeds: [embed],
            components: [row],
            flags: MessageFlags.Ephemeral,
         });
      } catch (error) {
         logger.error('Error in city select', error);
         try {
            await interaction.editReply({
               content: 'حدث خطأ',
               flags: 64,
            });
         } catch (replyError) {
            logger.error('Error replying to interaction', replyError);
         }
      }
   },
};
