const { wrapInteraction, safeError } = require('@interactions/flow/deferReply');
const { renderVersesList } = require('@interactions/helpers/tafseerHelper');

module.exports = {
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const parts = interaction.customId.split('_');
                const chapterId = parseInt(parts[parts.length - 1]);
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
            { ephemeral: true, label: 'tafseer_back_to_verses' },
        );
    },
};
