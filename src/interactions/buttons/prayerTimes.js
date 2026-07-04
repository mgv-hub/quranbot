const { wrapInteraction, safeReply, safeError } = require('@interactions/flow/responder');
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    EmbedBuilder,
    MessageFlags,
} = require('discord.js');
const { getCountries, loadPrayerTimesData } = require('@data/prayerTimesData');
const { calculatePagination, createPaginationRow } = require('@ui/pagination');
// Import config for consistent pagination limits
const { prayer_times_config } = require('@config/constants');
const coreLoader = require('@bot/bootstrap');
const { emoji, gif } = require('@helpers/emojis');

function truncateText(text, maxLength) {
    if (!text) return '';
    const str = String(text);
    return str.length > maxLength ? str.substring(0, maxLength) : str;
}

module.exports = {
    customId: 'prayer_times',
    async execute(interaction) {
        // Replaced nested try-catch and manual defer with wrapInteraction
        await wrapInteraction(
            interaction,
            async () => {
                const cdResult = coreLoader.checkCooldown(interaction.user.id, interaction.guildId, 'prayerTimesButton');
                if (!cdResult.allowed) {
                    // Reply with appropriate cooldown message based on user/server type
                    await safeError(interaction, coreLoader.getCooldownResponse(cdResult.remaining, cdResult.type));
                    return;
                }
                // Set cooldown immediately to prevent rapid clicking while data loads
                coreLoader.setCooldown(interaction.user.id, interaction.guildId, 'prayerTimesButton');
                await loadPrayerTimesData();
                const availableCountries = getCountries();
                if (!availableCountries || availableCountries.length === 0) {
                    await safeError(interaction, 'لا توجد دول متاحة في هذه اللحظة يرجى المحاولة لاحقاً', 'prayer_times_no_countries');
                    return;
                }
                // Use centralized constant
                const ITEMS_PER_PAGE = prayer_times_config.cities_per_page; // 25
                const pagination = calculatePagination(availableCountries.length, 0, ITEMS_PER_PAGE);
                const itemsSlice = availableCountries.slice(pagination.startIndex, pagination.endIndex);
                const countryMenuOptions = itemsSlice.map((country) => {
                    const flag = country.flag || `${emoji.globe}`;
                    const label = truncateText(`${country.name}`, 100);
                    const value = truncateText(country.code, 100);
                    const description = truncateText(`${country.nameEn}`, 100);
                    return new StringSelectMenuOptionBuilder().setLabel(label).setValue(value).setDescription(description).setEmoji(flag);
                });
                const countrySelect = new StringSelectMenuBuilder()
                    .setCustomId('select_country_prayer')
                    .setPlaceholder('اختر الدولة من القائمة')
                    .addOptions(countryMenuOptions);
                const selectRow = new ActionRowBuilder().addComponents(countrySelect);
                const paginationRow = createPaginationRow(0, pagination.totalPages, {
                    prevId: (p) => `prev_country_page_${p}`,
                    nextId: (p) => `next_country_page_${p}`,
                });
                const paginationButtons = paginationRow.components;
                const cancelBtn = new ButtonBuilder().setCustomId('cancel_prayer').setLabel('إلغاء').setStyle(ButtonStyle.Secondary);
                const paginationWithCancel = new ActionRowBuilder().addComponents(paginationButtons[0], paginationButtons[1], cancelBtn);

                const components = [
                    {
                        type: 17,
                        accent_color: 0xfefdfe,
                        components: [
                            { type: 10, content: '### مواقيت الصلاة' },
                            { type: 14, divider: true, spacing: 1 },
                            { type: 10, content: 'اختر الدولة من القائمة أدناه لعرض مواقيت الصلاة' },
                            { type: 14, divider: false, spacing: 2 },
                            {
                                type: 10,
                                content: '**طريقة الاستخدام**\n1- اضغط على قائمة الدول\n2- اختر دولتك\n3- اختر المدينة\n4- عرض المواقيت',
                            },
                            { type: 14, divider: true, spacing: 1 },
                            selectRow.toJSON(),
                            paginationWithCancel.toJSON(),
                        ],
                    },
                ];

                await safeReply(
                    interaction,
                    {
                        components,
                        flags: 32832,
                    },
                    'prayer_times_menu',
                );
            },
            { ephemeral: true, label: 'prayer_times_button' },
        );
    },
};
