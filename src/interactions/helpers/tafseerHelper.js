const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { fetchChapters } = require('@data/quranApi');
const { calculatePagination, createPaginationRow } = require('@ui/pagination');

async function renderSurahsList(page = 0) {
    const chapters = await fetchChapters();
    if (!chapters || chapters.length === 0) return null;

    const pagination = calculatePagination(chapters.length, page, 25);
    const pagedChapters = chapters.slice(pagination.startIndex, pagination.endIndex);

    const options = pagedChapters.map((ch) => {
        const label = `${ch.id}. ${ch.name_arabic || ch.name_simple}`;
        return new StringSelectMenuOptionBuilder()
            .setLabel(label.length > 100 ? label.substring(0, 100) : label)
            .setValue(String(ch.id))
            .setDescription(`عدد الآيات: ${ch.verses_count}`);
    });

    const menu = new StringSelectMenuBuilder().setCustomId('tafseer_surah_select').setPlaceholder('اختر السورة').addOptions(options);

    const selectRow = new ActionRowBuilder().addComponents(menu);
    const paginationRow = createPaginationRow(pagination.currentPage, pagination.totalPages, {
        prevId: (p) => `tafseer_surah_prev_${p}`,
        nextId: (p) => `tafseer_surah_next_${p}`,
    });

    return {
        components: [
            {
                type: 17,
                accent_color: 0xfefdfe,
                components: [
                    { type: 10, content: '### اختر السورة لعرض آياتها' },
                    { type: 14, divider: true, spacing: 1 },
                    selectRow.toJSON(),
                    paginationRow.toJSON(),
                ],
            },
        ],
    };
}

async function renderVersesList(chapterId, page = 0) {
    const chapters = await fetchChapters();
    const chapter = chapters.find((ch) => ch.id === chapterId);

    if (!chapter) return null;

    const versesCount = chapter.verses_count;
    const pagination = calculatePagination(versesCount, page, 25);

    const options = [];
    for (let i = pagination.startIndex; i < pagination.endIndex; i++) {
        options.push(new StringSelectMenuOptionBuilder().setLabel(`الآية ${i + 1}`).setValue(`${chapterId}_${i + 1}`));
    }

    const menu = new StringSelectMenuBuilder()
        .setCustomId('tafseer_verse_select')
        .setPlaceholder(`اختر رقم الآية من سورة ${chapter.name_arabic}`)
        .addOptions(options);

    const selectRow = new ActionRowBuilder().addComponents(menu);
    const paginationRow = createPaginationRow(pagination.currentPage, pagination.totalPages, {
        prevId: (p) => `tafseer_verse_prev_${chapterId}_${p}`,
        nextId: (p) => `tafseer_verse_next_${chapterId}_${p}`,
    });

    return {
        chapter,
        components: [
            {
                type: 17,
                accent_color: 0xfefdfe,
                components: [
                    { type: 10, content: `### سورة ${chapter.name_arabic}\nاختر رقم الآية لعرضها مع التفسير` },
                    { type: 14, divider: true, spacing: 1 },
                    selectRow.toJSON(),
                    paginationRow.toJSON(),
                ],
            },
        ],
    };
}

module.exports.renderSurahsList = renderSurahsList;
module.exports.renderVersesList = renderVersesList;
