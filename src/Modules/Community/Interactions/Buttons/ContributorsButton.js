const { safeReply } = require('@infrastructure/Discord/Flow/Responder');
const { buildContributorsComponents } = require('@modules/Community/Interactions/Helpers/ContributorsHelper');

module.exports = {
    customId: 'show_contributors',
    async execute(interaction) {
        const components = buildContributorsComponents();
        await safeReply(interaction, { components, flags: 64 }, 'contributors_info');
    },
};
