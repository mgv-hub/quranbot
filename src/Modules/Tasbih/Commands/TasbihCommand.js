const { wrapInteraction, safeReply } = require('@infrastructure/Discord/Flow/Responder');
const { buildTypeSelection } = require('@modules/Tasbih/Interactions/Helpers/TasbihHelper');

module.exports = {
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const load = buildTypeSelection();
                await safeReply(interaction, load, 'tasbih_cmd');
            },
            { ephemeral: true, label: 'tasbih_command' },
        );
    },
};
