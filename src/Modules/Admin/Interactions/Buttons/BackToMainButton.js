const { wrapInteraction } = require('@infrastructure/Discord/Flow/DeferReply');
const { resolveGuildState } = require('@core/Auth/AuthGuard');
const { rebuildAndSendControlPanel } = require('@infrastructure/Discord/UI/ControlPanelBuilder');
const logger = require('@infrastructure/Logging/Logger');

module.exports = {
    customId: 'back_to_main',
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const { guildId, guildState } = resolveGuildState(interaction);
                await rebuildAndSendControlPanel(interaction, guildState, guildId);
            },
            { context: { label: 'back_to_main_button', logger } },
        );
    },
};
