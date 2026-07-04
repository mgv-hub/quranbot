const { wrapInteraction } = require('@interactions/flow/deferReply');
const { resolveGuildState } = require('@auth/guard');
const { saveSetupGuildsToFirebase } = require('@database/firebase');
const logger = require('@logging/logger');
const { buildLoadingV2, buildErrorV2, buildSuccessV2 } = require('@interactions/helpers/joinChannelUI');
const { validateTargetChannel, executeVoiceJoin } = require('@interactions/helpers/voiceJoinHelper');

module.exports = {
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const { guildId, guildState } = resolveGuildState(interaction);
                const customId = interaction.customId;
                const isSave = customId.startsWith('save_join_channel_');
                const channelId = customId.split('_').pop();

                await interaction.editReply({ components: buildLoadingV2(channelId), flags: 32832 });

                const validation = await validateTargetChannel(interaction.guild, channelId);
                if (!validation.valid) {
                    return await interaction.editReply({
                        components: buildErrorV2(validation.error.title, validation.error.desc),
                        flags: 32832,
                    });
                }

                if (isSave) {
                    if (!global.setupGuilds) global.setupGuilds = {};
                    if (!global.setupGuilds[guildId]) global.setupGuilds[guildId] = {};
                    global.setupGuilds[guildId].voiceChannelId = channelId;

                    saveSetupGuildsToFirebase(global.setupGuilds).catch((err) => logger.error(err));
                }

                try {
                    await executeVoiceJoin(guildId, guildState, validation.channel, interaction.guild.voiceAdapterCreator);
                } catch (err) {
                    if (err.message && err.message.includes('maximum player capacity')) {
                        logger.warn(`Guild ${guildId} Join failed: Lavalink nodes at max capacity`);
                        return await interaction.editReply({
                            components: buildErrorV2('الخوادم ممتلئة', 'جميع الخوادم الصوتية ممتلئة حالياً، يرجى المحاولة لاحقاً'),
                            flags: 32832,
                        });
                    }
                    throw err;
                }

                await interaction.editReply({ components: buildSuccessV2(isSave, channelId), flags: 32832 });
            },
            { context: { label: 'join_channel_prompt_button', logger } },
        );
    },
};
