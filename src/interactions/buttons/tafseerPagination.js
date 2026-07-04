const { wrapInteraction, safeError } = require('@interactions/flow/deferReply');
const { renderSurahsList, renderVersesList } = require('@interactions/helpers/tafseerHelper');

module.exports = {
    customId: 'tafseer_pagination',
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const customId = interaction.customId;
                const parts = customId.split('_');
                const isSurah = parts[1] === 'surah';
                const direction = parts[2];
                const currentPage = parseInt(parts[parts.length - 1]);
                const newPage = direction === 'prev' ? currentPage - 1 : currentPage + 1;

                let result;
                if (isSurah) {
                    result = await renderSurahsList(newPage);
                    if (!result) {
                        await safeError(interaction, 'فشل في جلب قائمة السور');
                        return;
                    }
                } else {
                    const chapterId = Number(parts[3]);
                    result = await renderVersesList(chapterId, newPage);
                    if (!result) {
                        await safeError(interaction, 'السورة غير موجودة');
                        return;
                    }
                }

                await interaction.editReply({
                    flags: 32768,
                    components: result.components,
                });
            },
            { ephemeral: true, label: 'tafseer_pagination_button' },
        );
    },
};
