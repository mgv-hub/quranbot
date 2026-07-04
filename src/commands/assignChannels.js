const { wrapInteraction } = require('@interactions/flow/deferReply');
const { resolveGuildState } = require('@auth/guard');
const { assignSession } = require('@interactions/helpers/assignSession');
const { buildInitMessage } = require('@interactions/helpers/assignChannelsUI');
const logger = require('@logging/logger');

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
