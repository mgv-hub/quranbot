const { wrapInteraction, safeError } = require('@interactions/flow/deferReply');
const { fetchChapters, fetchVerse } = require('@data/quranApi');
const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { calculatePagination, createPaginationRow } = require('@ui/pagination');

module.exports = {
    customId: 'tafseer_verse_select',
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const [chapterId, verseNumber] = interaction.values[0].split('_').map(Number);
                const chapters = await fetchChapters();
                const chapter = chapters.find((ch) => ch.id === chapterId);
                const verse = await fetchVerse(chapterId, verseNumber);

                if (!verse) {
                    await safeError(interaction, 'فشل في جلب الآية من الخادم الخارجي');
                    return;
                }

                const tafsirText = verse.tafsir_text || 'التفسير غير متاح';
                const verseText = verse.text_uthmani || 'النص غير متاح';
                const ayahBtn = new ButtonBuilder().setCustomId('tafseer_restart').setLabel('العودة للسور').setStyle(ButtonStyle.Secondary);

                await interaction.editReply({
                    flags: 32768,
                    components: [
                        {
                            type: 17,
                            accent_color: 0xfefdfe,
                            components: [
                                { type: 10, content: `### سورة ${chapter?.name_arabic || chapterId} - الآية ${verseNumber}` },
                                { type: 14, divider: true, spacing: 1 },
                                { type: 10, content: `**النص:**\n ${verseText}` },
                                { type: 14, divider: false, spacing: 2 },
                                { type: 10, content: `**التفسير الميسر:**\n ${tafsirText}` },
                                { type: 14, divider: true, spacing: 1 },
                                { type: 10, content: '*المصدر: api.quran.com*' },
                                { type: 14, divider: true, spacing: 1 },
                                {
                                    type: 10,
                                    content:
                                        '> **تنويه هام:** يعتمد البوت على واجهة برمجية خارجية لجلب النصوص، وقد تظهر أحياناً نصوص تفسيرية أو حواشي مدمجة مع الآيات في بعض النتائج وليست من نص القرآن الكريم بسبب بيانات المصدر الخارجي.',
                                },
                                {
                                    type: 1,
                                    components: [ayahBtn.toJSON()],
                                },
                            ],
                        },
                    ],
                });
            },
            { ephemeral: true, label: 'tafseer_verse_menu' },
        );
    },
};
