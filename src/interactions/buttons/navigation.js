const { wrapInteraction } = require('@interactions/flow/deferReply');
const { checkAuthorization, resolveGuildState } = require('@auth/guard');
const { rebuildAndSendControlPanel } = require('@ui/controlPanelBuilder');
const logger = require('@logging/logger');

module.exports = {
    customId: 'navigation',
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const authorized = await checkAuthorization(interaction, interaction.customId);
                if (!authorized) return;

                const { guildId, guildState } = resolveGuildState(interaction);
                const totalSurahPages = Math.ceil(global.surahNames.length / 25);
                const totalReciterPages = Math.ceil(Object.keys(global.reciters).length / 25);
                const actionId = interaction.customId;

                if (actionId === 'prev_page' && guildState.currentPage === 0) return;
                if (actionId === 'next_page' && guildState.currentPage >= totalSurahPages - 1) return;
                if (actionId === 'prev_reciter_page' && guildState.currentReciterPage === 0) return;
                if (actionId === 'next_reciter_page' && guildState.currentReciterPage >= totalReciterPages - 1) return;

                if (actionId === 'prev_page' && guildState.currentPage > 0) {
                    guildState.currentPage--;
                    global.saveRuntimeStates();
                }
                if (actionId === 'next_page' && guildState.currentPage < totalSurahPages - 1) {
                    guildState.currentPage++;
                    global.saveRuntimeStates();
                }
                if (actionId === 'prev_reciter_page' && guildState.currentReciterPage > 0) {
                    guildState.currentReciterPage--;
                    global.saveRuntimeStates();
                }
                if (actionId === 'next_reciter_page' && guildState.currentReciterPage < totalReciterPages - 1) {
                    guildState.currentReciterPage++;
                    global.saveRuntimeStates();
                }

                await rebuildAndSendControlPanel(interaction, guildState, guildId);
            },
            { context: { label: 'navigation_button', logger } },
        );
    },
};
