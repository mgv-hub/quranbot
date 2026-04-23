require('pathlra-aliaser')();
const logger = require('@logger');
const {
   ActionRowBuilder,
   ButtonBuilder,
   ButtonStyle,
   StringSelectMenuBuilder,
   StringSelectMenuOptionBuilder,
   EmbedBuilder,
   MessageFlags,
} = require('discord.js');
const { getCountries, loadPrayerTimesData } = require('@prayerTimesData-core_utils');
function truncateText(text, maxLength) {
   if (!text) return '';
   const str = String(text);
   if (str.length > maxLength) {
      return str.substring(0, maxLength);
   }
   return str;
}
module.exports = {
   customId: 'prayer_times',
   async execute(interaction) {
      try {
         await interaction.deferUpdate().catch(() => {});
         await loadPrayerTimesData();
         const countries = getCountries();
         if (!countries || countries.length === 0) {
            return interaction
               .followUp({
                  content: 'لا توجد دول متاحة في هذه اللحظة يرجى المحاولة لاحقاً',
                  flags: MessageFlags.Ephemeral,
               })
               .catch(() => {});
         }
         const itemsPerPage = 25;
         const currentPage = 0;
         const totalPages = Math.ceil(countries.length / itemsPerPage);
         const startIndex = currentPage * itemsPerPage;
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
         if (countryOptions.length === 0) {
            return interaction
               .followUp({
                  content: 'لا توجد دول متاحة في هذه الصفحة',
                  flags: MessageFlags.Ephemeral,
               })
               .catch(() => {});
         }
         const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_country_prayer')
            .setPlaceholder('اختر الدولة من القائمة')
            .addOptions(countryOptions);
         const prevButton = new ButtonBuilder()
            .setCustomId(`prev_country_page_${currentPage}`)
            .setLabel('السابق')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === 0);
         const nextButton = new ButtonBuilder()
            .setCustomId(`next_country_page_${currentPage}`)
            .setLabel('التالي')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage >= totalPages - 1);
         const cancelButton = new ButtonBuilder()
            .setCustomId('cancel_prayer')
            .setLabel('إلغاء')
            .setStyle(ButtonStyle.Secondary);
         const selectRow = new ActionRowBuilder().addComponents(selectMenu);
         const navigationRow = new ActionRowBuilder().addComponents(prevButton, nextButton);
         const cancelRow = new ActionRowBuilder().addComponents(cancelButton);
         await interaction
            .followUp({
               embeds: [
                  new EmbedBuilder()
                     .setColor(0x1e1f22)
                     .setTitle('مواقيت الصلاة')
                     .setDescription('اختر الدولة من القائمة أدناه لعرض مواقيت الصلاة')
                     .addFields({
                        name: 'طريقة الاستخدام',
                        value: '1- اضغط على قائمة الدول\n2- اختر دولتك\n3- اختر المدينة\n4- عرض المواقيت',
                        inline: false,
                     }),
               ],
               components: [selectRow, navigationRow, cancelRow],
               flags: MessageFlags.Ephemeral,
            })
            .catch(() => {});
      } catch (error) {
         logger.error('Error in prayerTimes button', error);
         try {
            await interaction
               .followUp({
                  content: 'حدث خطأ يرجى المحاولة لاحقاً',
                  flags: MessageFlags.Ephemeral,
               })
               .catch(() => {});
         } catch (replyError) {
            logger.error('Error replying to interaction', replyError);
         }
      }
   },
};
