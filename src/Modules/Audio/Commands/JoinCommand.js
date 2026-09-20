const { wrapInteraction, safeError } = require('@infrastructure/Discord/Flow/DeferReply');
const { resolveGuildState } = require('@core/Auth/AuthGuard');
const logger = require('@infrastructure/Logging/Logger');
const voiceLogger = require('@infrastructure/Logging/VoiceLogger');
const { validateTargetChannel, executeVoiceJoin } = require('@modules/Audio/Interactions/Helpers/VoiceJoinHelper');
const { checkInitialIdleState } = require('@modules/Audio/Voice/VoiceIdle');

module.exports = {
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const { guildId, guildState } = resolveGuildState(interaction);
                voiceLogger.connection(guildId, 'Join command executed', { userId: interaction.user.id });

                const setupConfig = global.setupGuilds?.[guildId];
                if (!setupConfig?.voiceChannelId) {
                    await safeError(interaction, 'لم يتم اعداد فئة القرآن بعد استخدم امر الاعداد اولا');
                    return;
                }

                const { valid, channel, error } = await validateTargetChannel(interaction.guild, setupConfig.voiceChannelId);
                if (!valid) {
                    await safeError(interaction, error);
                    return;
                }

                const botMember = interaction.guild.members.me;
                if (botMember?.voice?.channelId !== channel.id) {
                    try {
                        const result = await executeVoiceJoin(guildId, guildState, channel, interaction.guild.voiceAdapterCreator);
                        if (result.idle) {
                            await checkInitialIdleState(guildId, interaction.client);
                            await interaction.editReply({
                                content: 'تم الانضمام الى ' + channel.name + ' - لا يوجد مستخدمين حالياً، البوت في وضع الخمول',
                                flags: 64,
                            });
                        } else {
                            await interaction.editReply({ content: 'تم الانضمام الى ' + channel.name + ' جاري التشغيل', flags: 64 });
                        }
                    } catch (err) {
                        if (err.message?.includes('maximum player capacity')) {
                            await safeError(interaction, 'جميع الخوادم الصوتية ممتلئة حالياً، يرجى المحاولة لاحقاً');
                            return;
                        }
                        throw err;
                    }
                } else {
                    voiceLogger.connection(guildId, 'Bot already in target channel');
                    await interaction.editReply({ content: 'البوت موجود بالفعل في الغرفة الصوتية', flags: 64 });
                }
            },
            { context: { label: 'join_command', logger } },
        );
    },
};
