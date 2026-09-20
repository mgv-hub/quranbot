const { wrapInteraction } = require('@infrastructure/Discord/Flow/DeferReply');
const { resolveGuildState } = require('@core/Auth/AuthGuard');
const logger = require('@infrastructure/Logging/Logger');
const { executeVoiceLeave } = require('@modules/Audio/Interactions/Helpers/VoiceLeaveHelper');

module.exports = {
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const { guildId, guildState } = resolveGuildState(interaction);
                const result = await executeVoiceLeave(guildId, guildState);
                await interaction.editReply({
                    content: result.success ? 'تم الخروج من الغرفة الصوتية بنجاح' : result.error,
                    flags: 64,
                });
            },
            { context: { label: 'leave_command', logger } },
        );
    },
};
