const { wrapInteraction } = require('@infrastructure/Discord/Flow/DeferReply');
const { resolveGuildState } = require('@core/Auth/AuthGuard');
const { assignSession } = require('@modules/Admin/Interactions/Helpers/AssignSession');
const { buildInitMessage } = require('@modules/Admin/Interactions/Helpers/AssignChannelsUI');
const logger = require('@infrastructure/Logging/Logger');

module.exports = {
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const { guildId } = resolveGuildState(interaction);
                const currentSetup = global.setupGuilds?.[guildId] || {};

                const before = {
                    categoryId: currentSetup.categoryId,
                    textId: currentSetup.textChannelId,
                    azkarId: currentSetup.azkarChannelId,
                    voiceId: currentSetup.voiceChannelId,
                };

                assignSession.set(guildId, { step: 'init', before, after: {} });
                await interaction.editReply({ components: buildInitMessage(before), flags: 32832 });
            },
            { context: { label: 'assign_channels_command', logger } },
        );
    },
};
