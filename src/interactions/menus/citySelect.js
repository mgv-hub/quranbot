const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const logger = require('@logging/logger');
const fetch = require('node-fetch').default;
const { getCitiesForCountry, getTimeFormatForCountry } = require('@data/prayerTimesData');
const { getBrowserHeaders, TimeoutRequest } = require('@config/http');
const { createStandardEmbed, createPrayerTimesDisplay, createLoadingEmbed } = require('@ui/embedFactory');

function formatTime(time24, countryCode) {
    if (!time24 || typeof time24 !== 'string') return 'غير متاح';
    const displayFormat = getTimeFormatForCountry(countryCode);
    const parts = time24.split(':');
    if (parts.length < 2) return time24;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (displayFormat === '24') {
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    } else {
        const period = hours >= 12 ? 'م' : 'ص';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const hoursStr = hours.toString().padStart(2, '0');
        const minutesStr = minutes.toString().padStart(2, '0');
        return `${hoursStr}:${minutesStr} ${period}`;
    }
}

// Fetch prayer times from aladhan API with region-specific calculation methods
async function fetchPrayerTimes(lat, lng, cityName, countryCode) {
    try {
        const currentDate = new Date();
        const unixTimestamp = Math.floor(currentDate.getTime() / 1000);
        let calculationMethod = 2;
        if (countryCode === 'EG') {
            calculationMethod = 5;
        } else if (countryCode === 'SA') {
            calculationMethod = 4;
        } else if (countryCode === 'KW' || countryCode === 'QA' || countryCode === 'BH') {
            calculationMethod = 3;
        } else if (countryCode === 'AE') {
            calculationMethod = 1;
        }
        const apiUrl = `https://api.aladhan.com/v1/timings/${unixTimestamp}?latitude=${lat}&longitude=${lng}&method=${calculationMethod}`;
        const response = await fetch(apiUrl, {
            headers: getBrowserHeaders(),
            timeout: TimeoutRequest('default'),
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const apiData = await response.json();
        const prayerTimings = apiData.data.timings;
        const hijriDate = apiData.data.date.hijri;
        const gregorianDate = apiData.data.date.gregorian;
        return {
            fajr: formatTime(prayerTimings.Fajr, countryCode),
            sunrise: formatTime(prayerTimings.Sunrise, countryCode),
            dhuhr: formatTime(prayerTimings.Dhuhr, countryCode),
            asr: formatTime(prayerTimings.Asr, countryCode),
            maghrib: formatTime(prayerTimings.Maghrib, countryCode),
            isha: formatTime(prayerTimings.Isha, countryCode),
            hijriDate: `${hijriDate.day} ${hijriDate.month.ar} ${hijriDate.year}`,
            gregorianDate: `${gregorianDate.day} ${gregorianDate.month.en} ${gregorianDate.year}`,
            cityName: cityName,
            countryCode: countryCode,
            method: calculationMethod,
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
            // Acknowledge the interaction to prevent timeout
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
            // Show loading state while fetching prayer data

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
                            components: [{ type: 10, content: 'فشل في جلب مواقيت الصلاة. يرجى المحاولة لاحقاً' }],
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
                                content: `**الفجر:** ${prayerInfo.fajr}\n**الظهر:** ${prayerInfo.dhuhr}\n**العصر:** ${prayerInfo.asr}\n\n**المغرب:** ${prayerInfo.maghrib}\n**العشاء:** ${prayerInfo.isha}`,
                            },
                            { type: 14, divider: false, spacing: 1 },
                            {
                                type: 10,
                                content: `**التاريخ الهجري:** ${prayerInfo.hijriDate}\n**التاريخ الميلادي:** ${prayerInfo.gregorianDate}`,
                            },
                            { type: 14, divider: true, spacing: 1 },
                            {
                                type: 10,
                                content: `*تحذير: هذه المعلومات من api.aladhan.com - يرجى التحقق من الموقع الرسمي لمواقيت الصلاة في بلدك للمواعيد الدقيقة | المصدر: https://aladhan.com/prayer-times*`,
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
    },
};
