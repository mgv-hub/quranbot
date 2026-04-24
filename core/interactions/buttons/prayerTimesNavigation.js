require('pathlra-aliaser')();
const {
   ActionRowBuilder,
   ButtonBuilder,
   ButtonStyle,
   StringSelectMenuBuilder,
   StringSelectMenuOptionBuilder,
   EmbedBuilder,
   MessageFlags,
} = require('discord.js');
const logger = require('@logger');
const fetch = require('node-fetch').default;
const {
   getCountries,
   getCitiesForCountry,
   getCountryByCode,
   getTimeFormatForCountry,
} = require('@prayerTimesData-core_utils');
const { getBrowserHeaders, getTimeoutForRequest } = require('@httpConfig-core_utils');
function truncateText(text, maxLength) {
   if (!text) return '';
   const str = String(text);
   if (str.length > maxLength) {
      return str.substring(0, maxLength);
   }
   return str;
}
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
function createCountrySelectionEmbed(page, totalPages) {
   return new EmbedBuilder()
      .setColor(0x1e1f22)
      .setTitle('مواقيت الصلاة')
      .setDescription('اختر الدولة من القائمة أدناه')
      .setFooter({ text: `صفحة ${page + 1} من ${totalPages}` });
}
function createCountryComponents(countries, page, totalPages) {
   const itemsPerPage = 25;
   const startIndex = page * itemsPerPage;
   const endIndex = Math.min(startIndex + itemsPerPage, countries.length);
   const countryOptions = countries.slice(startIndex, endIndex).map((country) => {
      const countryFlag = country.flag || '🌍';
      const label = truncateText(`${country.name}`, 100);
      const value = truncateText(country.code, 100);
      const description = truncateText(`${country.nameEn}`, 100);
      return new StringSelectMenuOptionBuilder()
         .setLabel(label)
         .setValue(value)
         .setDescription(description)
         .setEmoji(countryFlag);
   });
   const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_country_prayer')
      .setPlaceholder('اختر الدولة')
      .addOptions(countryOptions);
   const prevButton = new ButtonBuilder()
      .setCustomId(`prev_country_page_${page}`)
      .setLabel('السابق')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0);
   const nextButton = new ButtonBuilder()
      .setCustomId(`next_country_page_${page}`)
      .setLabel('التالي')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1);
   const cancelButton = new ButtonBuilder()
      .setCustomId('cancel_prayer')
      .setLabel('إلغاء')
      .setStyle(ButtonStyle.Secondary);
   const selectRow = new ActionRowBuilder().addComponents(selectMenu);
   const navigationRow = new ActionRowBuilder().addComponents(prevButton, nextButton);
   const cancelRow = new ActionRowBuilder().addComponents(cancelButton);
   return [selectRow, navigationRow, cancelRow];
}
module.exports = {
   customId: 'prayer_navigation',
   async execute(interaction) {
      try {
         await interaction.deferUpdate().catch(() => {});
         const countries = getCountries();
         if (!countries || countries.length === 0) {
            return interaction
               .followUp({
                  content: 'لا توجد دول متاحة',
                  flags: MessageFlags.Ephemeral,
               })
               .catch(() => {});
         }
         const itemsPerPage = 25;
         const totalPages = Math.ceil(countries.length / itemsPerPage);
         if (interaction.customId === 'home_prayer') {
            const components = createCountryComponents(countries, 0, totalPages);
            const embed = createCountrySelectionEmbed(0, totalPages);
            await interaction
               .followUp({
                  embeds: [embed],
                  components: components,
                  flags: MessageFlags.Ephemeral,
               })
               .catch(() => {});
         } else if (interaction.customId === 'refresh_prayer') {
            const embed = interaction.message.embeds[0];
            if (!embed || !embed.description) {
               return interaction
                  .followUp({
                     content: 'لا توجد بيانات لتحديثها',
                     flags: MessageFlags.Ephemeral,
                  })
                  .catch(() => {});
            }
            const desc = embed.description;
            const match = desc.match(/\*\*(.+?) - (.+?)\*\*/);
            if (!match) {
               return interaction
                  .followUp({
                     content: 'لا توجد بيانات لتحديثها',
                     flags: MessageFlags.Ephemeral,
                  })
                  .catch(() => {});
            }
            const cityName = match[1];
            const countryCode = match[2];
            let city = null;
            const cities = getCitiesForCountry(countryCode);
            if (cities) {
               city = cities.find((c) => c.name === cityName);
            }
            if (!city) {
               return interaction
                  .followUp({
                     content: 'المدينة غير متاحة',
                     flags: MessageFlags.Ephemeral,
                  })
                  .catch(() => {});
            }
            await interaction
               .followUp({
                  embeds: [
                     {
                        color: 0x1e1f22,
                        title: 'جاري تحديث مواقيت الصلاة',
                        description: `المدينة: ${city.name}\nيرجى الانتظار...`,
                     },
                  ],
                  components: [],
                  flags: MessageFlags.Ephemeral,
               })
               .catch(() => {});
            const prayerData = await fetchPrayerTimes(
               city.lat,
               city.lng,
               city.name,
               countryCode,
            );
            if (!prayerData) {
               return interaction
                  .followUp({
                     content: 'فشل في جلب مواقيت الصلاة. يرجى المحاولة لاحقاً',
                     flags: MessageFlags.Ephemeral,
                  })
                  .catch(() => {});
            }
            const countryData = getCountryByCode(countryCode);
            const countryFlag = countryData?.flag || '';
            const newEmbed = new EmbedBuilder()
               .setColor(0x1e1f22)
               .setTitle(`${countryFlag} مواقيت الصلاة`)
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
                  text: `⚠️ تحذير: هذه المعلومات من api.aladhan.com - يرجى التحقق من الموقع الرسمي لمواقيت الصلاة في بلدك للمواعيد الدقيقة | المصدر: https://aladhan.com/prayer-times`,
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
            await interaction
               .followUp({
                  embeds: [newEmbed],
                  components: [row],
                  flags: MessageFlags.Ephemeral,
               })
               .catch(() => {});
         } else if (interaction.customId === 'back_country_prayer') {
            const components = createCountryComponents(countries, 0, totalPages);
            const embed = createCountrySelectionEmbed(0, totalPages);
            await interaction
               .followUp({
                  embeds: [embed],
                  components: components,
                  flags: MessageFlags.Ephemeral,
               })
               .catch(() => {});
         } else if (interaction.customId === 'cancel_prayer') {
            await interaction
               .followUp({
                  embeds: [
                     {
                        color: 0x1e1f22,
                        title: 'تم الإلغاء',
                        description: 'تم إلغاء عملية اختيار مواقيت الصلاة',
                     },
                  ],
                  components: [],
                  flags: MessageFlags.Ephemeral,
               })
               .catch(() => {});
         } else if (interaction.customId.startsWith('prev_country_page_')) {
            const currentPage = parseInt(interaction.customId.split('_').pop());
            const newPage = Math.max(0, currentPage - 1);
            const components = createCountryComponents(countries, newPage, totalPages);
            const embed = createCountrySelectionEmbed(newPage, totalPages);
            await interaction
               .followUp({
                  embeds: [embed],
                  components: components,
                  flags: MessageFlags.Ephemeral,
               })
               .catch(() => {});
         } else if (interaction.customId.startsWith('next_country_page_')) {
            const currentPage = parseInt(interaction.customId.split('_').pop());
            const newPage = Math.min(totalPages - 1, currentPage + 1);
            const components = createCountryComponents(countries, newPage, totalPages);
            const embed = createCountrySelectionEmbed(newPage, totalPages);
            await interaction
               .followUp({
                  embeds: [embed],
                  components: components,
                  flags: MessageFlags.Ephemeral,
               })
               .catch(() => {});
         }
      } catch (error) {
         logger.error('Error in prayer navigation', error);
         try {
            await interaction
               .followUp({
                  content: 'حدث خطأ',
                  flags: MessageFlags.Ephemeral,
               })
               .catch(() => {});
         } catch (replyError) {
            logger.error('Error replying to interaction', replyError);
         }
      }
   },
};
