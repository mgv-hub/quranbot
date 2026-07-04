const { wrapInteraction, safeError } = require('@interactions/flow/deferReply');
const { searchQuran } = require('@data/quranApi');
const { setSearchCache, buildComponents } = require('@interactions/helpers/searchHelper');
const { emoji, gif } = require('@helpers/emojis');

module.exports = {
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const keyword = interaction.options.getString('كلمة')?.trim();

                if (!keyword) {
                    await safeError(interaction, 'يرجى إدخال كلمة للبحث');
                    return;
                }
                if (keyword.length > 50) {
                    await safeError(interaction, 'كلمة البحث طويلة جداً (الحد الأقصى 50 حرف)');
                    return;
                }

                const result = await searchQuran(keyword);
                if (!result.success) {
                    await safeError(interaction, result.error || 'حدث خطأ أثناء البحث');
                    return;
                }

                if (result.count === 0) {
                    await interaction.editReply({
                        flags: 32832,
                        components: [
                            {
                                type: 17,
                                accent_color: 0xfefdfe,
                                components: [
                                    { type: 10, content: `### ${emoji.search} نتائج البحث عن: "${keyword}"` },
                                    { type: 14, divider: true, spacing: 1 },
                                    { type: 10, content: 'لم يتم العثور على أي نتائج لهذه الكلمة في القرآن الكريم.' },
                                    { type: 14, divider: true, spacing: 1 },
                                    { type: 10, content: '*المصدر: api.alquran.cloud*' },
                                ],
                            },
                        ],
                    });
                    return;
                }

                const searchId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
                setSearchCache(searchId, result.matches, keyword);

                const replyload = buildComponents(searchId, keyword, result.matches, 0);
                await interaction.editReply(replyload);
            },
            { ephemeral: true, label: 'search_word_command' },
        );
    },
};
