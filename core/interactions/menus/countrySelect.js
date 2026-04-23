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
const { getCitiesForCountry, getCountryByCode } = require('@prayerTimesData-core_utils');

module.exports = {
   customId: 'select_country_prayer',
   async execute(interaction) {
      try {
         await interaction.deferUpdate();
         const selectedCountry = interaction.values[0];
         const countryData = getCountryByCode(selectedCountry);
         const countryFlag = countryData?.flag || '';
         const cities = getCitiesForCountry(selectedCountry);
         if (cities.length === 0) {
            return interaction.editReply({
               content: 'لا توجد مدن متاحة لهذه الدولة',
               flags: 64,
            });
         }
         const cityOptions = cities.map((city, index) =>
            new StringSelectMenuOptionBuilder()
               .setLabel(city.name)
               .setValue(`${selectedCountry}_${index}`)
               .setDescription(city.nameEn)
               .setEmoji(countryFlag),
         );
         const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_city_prayer')
            .setPlaceholder(`${countryFlag} اختر المدينة`)
            .addOptions(cityOptions.slice(0, 25));
         const row = new ActionRowBuilder().addComponents(selectMenu);
         const backButton = new ButtonBuilder()
            .setCustomId('back_country_prayer')
            .setLabel('رجوع للدول')
            .setStyle(ButtonStyle.Secondary);
         const cancelRow = new ActionRowBuilder().addComponents(backButton);
         await interaction.editReply({
            embeds: [
               new EmbedBuilder()
                  .setColor(0x1e1f22)
                  .setTitle(`مواقيت الصلاة`)
                  .setDescription(
                     `**الدولة المختارة:** ${countryFlag} ${countryData?.name || ''}\n**اختر المدينة من القائمة أدناه**`,
                  )
                  .addFields(
                     {
                        name: 'الدولة',
                        value: `${countryFlag} ${countryData?.name} (${countryData?.nameEn})`,
                        inline: true,
                     },
                     {
                        name: 'عدد المدن',
                        value: `${cities.length} مدينة`,
                        inline: true,
                     },
                  ),
            ],
            components: [row, cancelRow],
            flags: MessageFlags.Ephemeral,
         });
      } catch (error) {
         logger.error('Error in country select', error);
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
