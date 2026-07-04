const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    MessageFlags,
} = require('discord.js');
const { getCitiesForCountry, getCountryByCode } = require('@data/prayerTimesData');
const { createStandardEmbed, createCountrySelectionEmbed } = require('@ui/embedFactory');
const logger = require('@logging/logger');

module.exports = {
    customId: 'select_country_prayer',
    async execute(interaction) {
        try {
            await interaction.deferUpdate();
            const selectedCountryCode = interaction.values[0];
            const countryInfo = getCountryByCode(selectedCountryCode);
            const countryFlag = countryInfo?.flag || '';
            const availableCities = getCitiesForCountry(selectedCountryCode);
            if (availableCities.length === 0) {
                return interaction.editReply({
                    components: [
                        {
                            type: 17,
                            accent_color: 0xfefdfe,
                            components: [{ type: 10, content: 'لا توجد مدن متاحة لهذه الدولة' }],
                        },
                    ],
                    flags: 32832,
                });
            }
            const cityMenuOptions = availableCities.map((city, index) =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(city.name)
                    .setValue(`${selectedCountryCode}_${index}`)
                    .setDescription(city.nameEn)
                    .setEmoji(countryFlag),
            );
            const citySelect = new StringSelectMenuBuilder()
                .setCustomId('select_city_prayer')
                .setPlaceholder(`${countryFlag} اختر المدينة`)
                .addOptions(cityMenuOptions.slice(0, 25));
            const cityRow = new ActionRowBuilder().addComponents(citySelect);
            const backBtn = new ButtonBuilder().setCustomId('back_country_prayer').setLabel('رجوع للدول').setStyle(ButtonStyle.Secondary);
            const backRow = new ActionRowBuilder().addComponents(backBtn);

            await interaction.editReply({
                components: [
                    {
                        type: 17,
                        accent_color: 0xfefdfe,
                        components: [
                            { type: 10, content: `### مواقيت الصلاة` },
                            { type: 14, divider: true, spacing: 1 },
                            {
                                type: 10,
                                content: `**الدولة المختارة:** ${countryFlag} ${countryInfo?.name || ''}\n**اختر المدينة من القائمة أدناه**`,
                            },
                            { type: 14, divider: false, spacing: 2 },
                            { type: 10, content: `**عدد المدن:** ${availableCities.length} مدينة` },
                            { type: 14, divider: true, spacing: 1 },
                            cityRow.toJSON(),
                            backRow.toJSON(),
                        ],
                    },
                ],
                flags: 32832,
            });
        } catch (error) {
            logger.error('Error in country select', error);
            try {
                await interaction.editReply({
                    components: [
                        {
                            type: 17,
                            accent_color: 0xfefdfe,
                            components: [{ type: 10, content: 'حدث خطأ' }],
                        },
                    ],
                    flags: 32832,
                });
            } catch (replyErr) {
                logger.error('Error replying to interaction', replyErr);
            }
        }
    },
};
