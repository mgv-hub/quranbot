const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder } = require('discord.js');
const { prayer_times_config } = require('@config/Constants');
const { emoji } = require('@shared/Helpers/Emojis');

function truncateText(text, maxLength) {
    if (!text) return '';
    const str = String(text);
    return str.length > maxLength ? str.substring(0, maxLength) : str;
}

function createCountrySelectionEmbed(currentPage, totalPages) {
    return new EmbedBuilder()
        .setColor(0xfefdfe)
        .setTitle('مواقيت الصلاة')
        .setDescription('اختر الدولة من القائمة أدناه')
        .setFooter({ text: `صفحة ${currentPage + 1} من ${totalPages}` });
}

function createCountryComponents(countries, currentPage, totalPages) {
    const ITEMS_PER_PAGE = prayer_times_config.cities_per_page;
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, countries.length);

    const menuOptions = countries.slice(startIndex, endIndex).map((country) => {
        const flag = country.flag || `${emoji.globe}`;
        const label = truncateText(`${country.name}`, 100);
        const value = truncateText(country.code, 100);
        const description = truncateText(`${country.nameEn}`, 100);
        return new StringSelectMenuOptionBuilder().setLabel(label).setValue(value).setDescription(description).setEmoji(flag);
    });

    const countrySelect = new StringSelectMenuBuilder()
        .setCustomId('select_country_prayer')
        .setPlaceholder('اختر الدولة')
        .addOptions(menuOptions);

    const prevBtn = new ButtonBuilder().setCustomId(`prev_country_page_${currentPage}`).setLabel('السابق').setStyle(ButtonStyle.Secondary).setDisabled(currentPage === 0);
    const nextBtn = new ButtonBuilder().setCustomId(`next_country_page_${currentPage}`).setLabel('التالي').setStyle(ButtonStyle.Secondary).setDisabled(currentPage >= totalPages - 1);
    const cancelBtn = new ButtonBuilder().setCustomId('cancel_prayer').setLabel('إلغاء').setStyle(ButtonStyle.Secondary);

    const selectRow = new ActionRowBuilder().addComponents(countrySelect);
    const navRow = new ActionRowBuilder().addComponents(prevBtn, nextBtn);
    const cancelRow = new ActionRowBuilder().addComponents(cancelBtn);

    return [{
        type: 17, accent_color: 0xfefdfe, components: [
            { type: 10, content: '### مواقيت الصلاة' },
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: 'اختر الدولة من القائمة أدناه' },
            { type: 14, divider: false, spacing: 2 },
            { type: 10, content: `**الصفحة:** ${currentPage + 1} من ${totalPages}` },
            { type: 14, divider: true, spacing: 1 },
            selectRow.toJSON(),
            navRow.toJSON(),
            cancelRow.toJSON(),
        ],
    }];
}

module.exports.createCountrySelectionEmbed = createCountrySelectionEmbed;
module.exports.createCountryComponents = createCountryComponents;
