const { wrapInteraction } = require('@interactions/flow/deferReply');
const { resolveGuildState } = require('@auth/guard');
const { rebuildAndSendControlPanel } = require('@ui/controlPanelBuilder');
const logger = require('@logging/logger');

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
