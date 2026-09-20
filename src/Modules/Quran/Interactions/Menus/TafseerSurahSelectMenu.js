const { wrapInteraction, safeError } = require('@infrastructure/Discord/Flow/DeferReply');
const { renderVersesList } = require('@modules/Quran/Interactions/Helpers/TafseerHelper');

module.exports = {
    customId: 'tafseer_surah_select',
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const chapterId = Number(interaction.values[0]);
                const result = await renderVersesList(chapterId, 0);

                if (!result) {
                    await safeError(interaction, 'السورة غير موجودة');
                    return;
                }

                await interaction.editReply({
                    flags: 32768,
                    components: result.components,
                });
            },

            { ephemeral: true, label: 'tafseer_surah_menu' },
        );
    },
};
