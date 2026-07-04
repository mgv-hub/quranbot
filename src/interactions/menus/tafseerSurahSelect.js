const { wrapInteraction, safeError } = require('@interactions/flow/deferReply');
const { renderVersesList } = require('@interactions/helpers/tafseerHelper');

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
