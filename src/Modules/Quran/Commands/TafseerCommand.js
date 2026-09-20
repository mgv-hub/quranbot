const { wrapInteraction, safeError } = require('@infrastructure/Discord/Flow/DeferReply');
const { renderSurahsList } = require('@modules/Quran/Interactions/Helpers/TafseerHelper');

module.exports = {
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const result = await renderSurahsList(0);
                if (!result) {
                    await safeError(interaction, 'فشل في جلب قائمة السور من الخادم الخارجي');
                    return;
                }
                await interaction.editReply({
                    flags: 32768,
                    components: result.components,
                });
            },
            { ephemeral: true, label: 'tafseer_command' },
        );
    },
};
