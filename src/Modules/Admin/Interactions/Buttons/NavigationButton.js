const { wrapInteraction } = require('@infrastructure/Discord/Flow/DeferReply');
const { checkAuthorization, resolveGuildState } = require('@core/Auth/AuthGuard');
const { rebuildAndSendControlPanel } = require('@infrastructure/Discord/UI/ControlPanelBuilder');
const logger = require('@infrastructure/Logging/Logger');

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
