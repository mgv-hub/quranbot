const { wrapInteraction, safeError } = require('@interactions/flow/deferReply');
const { getSearchCache, buildComponents, ITEMS_PER_PAGE } = require('@interactions/helpers/searchHelper');

module.exports = {
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const parts = interaction.customId.split('_');
                const searchId = parts[2];
                const page = parseInt(parts[3]);

                const cached = getSearchCache(searchId);
                if (!cached) {
                    await safeError(interaction, 'انتهت صلاحية نتائج البحث، يرجى البحث مرة أخرى');
                    return;
                }

                const { matches, keyword } = cached;
                const totalPages = Math.ceil(matches.length / ITEMS_PER_PAGE);

                if (page < 0 || page >= totalPages) {
                    await safeError(interaction, 'رقم الصفحة غير صالح');
                    return;
                }

                const replyload = buildComponents(searchId, keyword, matches, page);
                await interaction.editReply(replyload);
            },
            { ephemeral: true, label: 'search_pagination_button' },
        );
    },
};
