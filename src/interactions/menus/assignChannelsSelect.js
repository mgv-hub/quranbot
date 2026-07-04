const { wrapInteraction, safeError } = require('@interactions/flow/deferReply');
const { resolveGuildState } = require('@auth/guard');
const { assignSession } = require('@interactions/helpers/assignSession');
const logger = require('@logging/logger');
const { buildTextSelect, buildAzkarSelect, buildVoiceSelect, buildReviewMessage } = require('@interactions/helpers/assignChannelsUI');

module.exports = {
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const { guildId } = resolveGuildState(interaction);
                const session = assignSession.get(guildId);
                if (!session) return safeError(interaction, 'جلسة التعيين غير نشطة');

                const selectedId = interaction.values[0];
                const customId = interaction.customId;

                if (customId === 'assign_select_category') {
                    session.after.categoryId = selectedId;
                    session.step = 'text';

                    await interaction.editReply({ components: buildTextSelect(), flags: 32832 });
                } else if (customId === 'assign_select_text') {
                    session.after.textId = selectedId;
                    session.step = 'azkar';

                    await interaction.editReply({ components: buildAzkarSelect(), flags: 32832 });
                } else if (customId === 'assign_select_azkar') {
                    session.after.azkarId = selectedId;
                    session.step = 'voice';

                    await interaction.editReply({ components: buildVoiceSelect(), flags: 32832 });
                } else if (customId === 'assign_select_voice') {
                    session.after.voiceId = selectedId;
                    session.step = 'review';

                    await interaction.editReply({ components: buildReviewMessage(session.before, session.after), flags: 32832 });
                }
            },
            { context: { label: 'assign_channels_select_menu', logger } },
        );
    },
};
