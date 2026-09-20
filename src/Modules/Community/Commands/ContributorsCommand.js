const { wrapInteraction, safeReply } = require('@infrastructure/Discord/Flow/Responder');
const { buildContributorsComponents } = require('@modules/Community/Interactions/Helpers/ContributorsHelper');

module.exports = {
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const components = buildContributorsComponents();
                await safeReply(interaction, { components, flags: 64 }, 'contributors_cmd');
            },
            { ephemeral: true, label: 'contributors_cmd' },
        );
    },
};
