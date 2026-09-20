const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('@infrastructure/Logging/Logger');
const { getCountries, getCitiesForCountry, getCountryByCode } = require('@data/PrayerTimes/PrayerTimesData');
const { prayer_times_config } = require('@config/Constants');
const { fetchPrayerTimes } = require('@modules/Prayer/Times/Interactions/Buttons/PrayerTimesApiDataFetcher');
const { createCountryComponents } = require('@modules/Prayer/Times/Interactions/Buttons/CountrySelectionUIBuilder');

module.exports = {
    customId: 'prayer_navigation',
    async execute(interaction) {
        try {
            await interaction.deferUpdate().catch(() => {});
            const availableCountries = getCountries();

            if (!availableCountries || availableCountries.length === 0) {
                return interaction.followUp({ components: [{ type: 17, accent_color: 0xfefdfe, components: [{ type: 10, content: 'لا توجد دول متاحة' }] }], flags: 32832 }).catch(() => {});
            }

            const ITEMS_PER_PAGE = prayer_times_config.cities_per_page;
            const totalPages = Math.ceil(availableCountries.length / ITEMS_PER_PAGE);
            const actionId = interaction.customId;

            if (actionId === 'home_prayer' || actionId === 'back_country_prayer') {
                const components = createCountryComponents(availableCountries, 0, totalPages);
                await interaction.followUp({ components, flags: 32832 }).catch(() => {});
            } else if (actionId === 'refresh_prayer') {
                const components = interaction.message.components;
                let targetCityName = null;
                let targetCountryCode = null;

                if (components) {
                    for (const row of components) {
                        if (row.type === 17 && row.components) {
                            for (const comp of row.components) {
                                if (comp.type === 10 && comp.content) {
                                    const match = comp.content.match(/\*\*(.+?) - (.+?)\*\*/);
                                    if (match) { targetCityName = match[1]; targetCountryCode = match[2]; break; }
                                }
                            }
                        }
                        if (targetCityName) break;
                    }
                }
                if (!targetCityName) return interaction.followUp({ components: [{ type: 17, accent_color: 0xfefdfe, components: [{ type: 10, content: 'لا توجد بيانات لتحديثها' }] }], flags: 32832 }).catch(() => {});
                
                let targetCity = null;
                const citiesList = getCitiesForCountry(targetCountryCode);
                if (citiesList) targetCity = citiesList.find((c) => c.name === targetCityName);
                if (!targetCity) return interaction.followUp({ components: [{ type: 17, accent_color: 0xfefdfe, components: [{ type: 10, content: 'المدينة غير متاحة' }] }], flags: 32832 }).catch(() => {});
                
                await interaction.followUp({ components: [{ type: 17, accent_color: 0xfefdfe, components: [{ type: 10, content: '### جاري تحديث مواقيت الصلاة' }, { type: 14, divider: true, spacing: 1 }, { type: 10, content: `المدينة: ${targetCity.name} يرجى الانتظار...` }] }], flags: 32832 }).catch(() => {});
                
                const freshPrayerData = await fetchPrayerTimes(targetCity.lat, targetCity.lng, targetCity.name, targetCountryCode);
                if (!freshPrayerData) return interaction.followUp({ components: [{ type: 17, accent_color: 0xfefdfe, components: [{ type: 10, content: 'فشل في حساب مواقيت الصلاة محلياً. يرجى المحاولة لاحقاً' }] }], flags: 32832 }).catch(() => {});
                
                const countryInfo = getCountryByCode(targetCountryCode);
                const countryFlag = countryInfo?.flag || '';
                const homeBtn = new ButtonBuilder().setCustomId('home_prayer').setLabel('الرئيسية').setStyle(ButtonStyle.Secondary);
                const refreshBtn = new ButtonBuilder().setCustomId('refresh_prayer').setLabel('تحديث').setStyle(ButtonStyle.Secondary);
                const actionRow = new ActionRowBuilder().addComponents(homeBtn, refreshBtn);
                
                await interaction.followUp({
                    components: [{
                        type: 17, accent_color: 0xfefdfe, components: [
                            { type: 10, content: `### 🕌 مواقيت الصلاة` },
                            { type: 14, divider: true, spacing: 1 },
                            { type: 10, content: `**${freshPrayerData.cityName} - ${freshPrayerData.countryCode}**` },
                            { type: 14, divider: false, spacing: 2 },
                            { type: 10, content: `**الفجر:** ${freshPrayerData.fajr}\n**الظهر:** ${freshPrayerData.dhuhr}\n**العصر:** ${freshPrayerData.asr}\n**المغرب:** ${freshPrayerData.maghrib}\n**العشاء:** ${freshPrayerData.isha}` },
                            { type: 14, divider: false, spacing: 1 },
                            { type: 10, content: `**التاريخ الهجري:** ${freshPrayerData.hijriDate}\n**التاريخ الميلادي:** ${freshPrayerData.gregorianDate}` },
                            { type: 14, divider: true, spacing: 1 },
                            { type: 10, content: `*تحذير: هذه المعلومات محسوبة محلياً بدقة باستخدام مكتبة Adhan الرسمية - يرجى التحقق من الموقع الرسمي لمواقيت الصلاة في بلدك للمواعيد الدقيقة*` },
                            { type: 14, divider: true, spacing: 1 },
                            actionRow.toJSON(),
                        ],
                    }],
                    flags: 32832,
                }).catch(() => {});
            } else if (actionId === 'cancel_prayer') {
                await interaction.followUp({ components: [{ type: 17, accent_color: 0xfefdfe, components: [{ type: 10, content: '### تم الإلغاء' }, { type: 14, divider: true, spacing: 1 }, { type: 10, content: 'تم إلغاء عملية اختيار مواقيت الصلاة' }] }], flags: 32832 }).catch(() => {});
            } else if (actionId.startsWith('prev_country_page_') || actionId.startsWith('next_country_page_')) {
                const currentPage = parseInt(actionId.split('_').pop());
                const newPage = actionId.startsWith('prev_') ? Math.max(0, currentPage - 1) : Math.min(totalPages - 1, currentPage + 1);
                const components = createCountryComponents(availableCountries, newPage, totalPages);
                await interaction.followUp({ components, flags: 32832 }).catch(() => {});
            }
        } catch (error) {
            logger.error('Error in prayer navigation', error);
            try {
                await interaction.followUp({ components: [{ type: 17, accent_color: 0xfefdfe, components: [{ type: 10, content: 'حدث خطأ' }] }], flags: 32832 }).catch(() => {});
            } catch (replyErr) {
                logger.error('Error replying to interaction', replyErr);
            }
        }
    },
};
