const { wrapInteraction, safeError } = require('@interactions/flow/deferReply');
const { fetchFullSurah, fetchChapters } = require('@data/quranApi');

module.exports = {
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const surahInput = interaction.options.getString('سورة');

                if (!surahInput) {
                    await safeError(interaction, 'يرجى إدخال اسم أو رقم السورة');
                    return;
                }

                let surahNumber = null;
                const num = parseInt(surahInput, 10);

                if (!isNaN(num) && num >= 1 && num <= 114) {
                    surahNumber = num;
                } else {
                    const chapters = await fetchChapters();
                    const chapter = chapters.find(
                        (ch) =>
                            ch.name_arabic === surahInput ||
                            ch.name_simple === surahInput ||
                            ch.name === surahInput ||
                            ch.name_arabic.includes(surahInput),
                    );
                    if (chapter) {
                        surahNumber = chapter.id;
                    }
                }

                if (!surahNumber || surahNumber < 1 || surahNumber > 114) {
                    await safeError(interaction, 'لم يتم العثور على السورة. تأكد من كتابة الاسم أو الرقم بشكل صحيح (1-114).');
                    return;
                }

                const surahText = await fetchFullSurah(surahNumber);
                if (!surahText) {
                    await safeError(interaction, 'فشل في جلب نص السورة من الخادم الخارجي');
                    return;
                }

                const surahName = global.surahNames[surahNumber - 1] || `سورة ${surahNumber}`;
                const buffer = Buffer.from(`سورة ${surahName}\n\n${surahText}`, 'utf8');

                await interaction.editReply({
                    content: `**النص الكامل لسورة ${surahName}**`,
                    files: [{ attachment: buffer, name: `${surahName}.txt` }],
                    flags: 64,
                });
            },
            { ephemeral: true, label: 'surah_command' },
        );
    },
};
