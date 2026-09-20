const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('@infrastructure/Logging/Logger');
const { getCitiesForCountry } = require('@data/PrayerTimes/PrayerTimesData');
const { fetchPrayerTimes } = require('@modules/Prayer/Times/Interactions/Buttons/PrayerTimesApiDataFetcher');

module.exports.customId = 'select_city_prayer';
module.exports.execute = async function execute(interaction) {
    try {
        await interaction.deferUpdate();
        const selectedValue = interaction.values[0];
        const valueParts = selectedValue.split('_');
        const targetCountryCode = valueParts[0];
        const cityIndex = parseInt(valueParts[1]);
        const citiesList = getCitiesForCountry(targetCountryCode);
        const selectedCity = citiesList[cityIndex];

        if (!selectedCity) {
            return interaction.editReply({
                components: [
                    {
                        type: 17,
                        accent_color: 0xfefdfe,
                        components: [{ type: 10, content: 'المدينة غير متاحة' }],
                    },
                ],
                flags: 32832,
            });
        }

        await interaction.editReply({
            components: [
                {
                    type: 17,
                    accent_color: 0xfefdfe,
                    components: [
                        { type: 10, content: '### جاري التحميل' },
                        { type: 14, divider: true, spacing: 1 },
                        { type: 10, content: `المدينة: ${selectedCity.name}\nيرجى الانتظار...` },
                    ],
                },
            ],
            flags: 32832,
        });

        const prayerInfo = await fetchPrayerTimes(selectedCity.lat, selectedCity.lng, selectedCity.name, targetCountryCode);

        if (!prayerInfo) {
            return interaction.editReply({
                components: [
                    {
                        type: 17,
                        accent_color: 0xfefdfe,
                        components: [{ type: 10, content: 'فشل في حساب مواقيت الصلاة محلياً. يرجى المحاولة لاحقاً' }],
                    },
                ],
                flags: 32832,
            });
        }

        const homeBtn = new ButtonBuilder().setCustomId('home_prayer').setLabel('الرئيسية').setStyle(ButtonStyle.Secondary);
        const refreshBtn = new ButtonBuilder().setCustomId('refresh_prayer').setLabel('تحديث').setStyle(ButtonStyle.Secondary);
        const actionRow = new ActionRowBuilder().addComponents(homeBtn, refreshBtn);

        await interaction.editReply({
            components: [
                {
                    type: 17,
                    accent_color: 0xfefdfe,
                    components: [
                        { type: 10, content: `### 🕌 مواقيت الصلاة` },
                        { type: 14, divider: true, spacing: 1 },
                        { type: 10, content: `**${prayerInfo.cityName} - ${prayerInfo.countryCode}**` },
                        { type: 14, divider: false, spacing: 2 },
                        {
                            type: 10,
                            content: `**الفجر:** ${prayerInfo.fajr}\n**الظهر:** ${prayerInfo.dhuhr}\n**العصر:** ${prayerInfo.asr}\n**المغرب:** ${prayerInfo.maghrib}\n**العشاء:** ${prayerInfo.isha}`,
                        },
                        { type: 14, divider: false, spacing: 1 },
                        {
                            type: 10,
                            content: `**التاريخ الهجري:** ${prayerInfo.hijriDate}\n**التاريخ الميلادي:** ${prayerInfo.gregorianDate}`,
                        },
                        { type: 14, divider: true, spacing: 1 },
                        {
                            type: 10,
                            content: `*تحذير: هذه المعلومات محسوبة محلياً بدقة باستخدام مكتبة Adhan الرسمية - يرجى التحقق من الموقع الرسمي لمواقيت الصلاة في بلدك للمواعيد الدقيقة*`,
                        },
                        { type: 14, divider: true, spacing: 1 },
                        actionRow.toJSON(),
                    ],
                },
            ],
            flags: 32832,
        });
    } catch (error) {
        logger.error('Error in city select', error);
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
};
