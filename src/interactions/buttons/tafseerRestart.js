const { wrapInteraction, safeError } = require('@interactions/flow/deferReply');
const { renderSurahsList } = require('@interactions/helpers/tafseerHelper');

module.exports = {
    customId: 'tafseer_restart',
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
            { ephemeral: true, label: 'tafseer_restart_button' },
        );
    },
};
