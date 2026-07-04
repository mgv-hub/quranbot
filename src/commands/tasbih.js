const { wrapInteraction, safeReply } = require('@interactions/flow/responder');
const { buildTypeSelection } = require('@interactions/helpers/tasbihHelper');

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
