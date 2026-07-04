const { wrapInteraction, safeError } = require('@interactions/flow/deferReply');
const { resolveGuildState } = require('@auth/guard');
const logger = require('@logging/logger');
const voiceLogger = require('@logging/voiceLogger');
const coreLoader = require('@bot/bootstrap');
const { buildPromptV2 } = require('@interactions/helpers/joinChannelUI');

module.exports = {
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const { guildId } = resolveGuildState(interaction);
                const targetChannel = interaction.options.getChannel('قناة');

                voiceLogger.connection(guildId, 'Join channel command executed', {
                    userId: interaction.user.id,
                    channelId: targetChannel?.id,
                    guildName: interaction.guild?.name,
                });

                if (!targetChannel || targetChannel.type !== coreLoader.ChannelType.GuildVoice) {
                    await safeError(interaction, 'يرجى اختيار غرفة صوتية صالحة');
                    return;
                }
                const botPerms = targetChannel.permissionsFor(interaction.guild.members.me);
                if (
                    !botPerms.has(coreLoader.PermissionsBitField.Flags.Connect) ||
                    !botPerms.has(coreLoader.PermissionsBitField.Flags.Speak)
                ) {
                    await safeError(interaction, 'البوت ليس لديه الصلاحيات الكاملة للانضمام إلى هذه الغرفة الصوتية');
                    return;
                }

                const currentSetup = global.setupGuilds?.[guildId];
                const hasSetup = !!currentSetup && !!currentSetup.voiceChannelId;
                let isOldChannelValid = false;

                if (hasSetup) {
                    const oldVoiceId = currentSetup.voiceChannelId;
                    const oldChannel = oldVoiceId
                        ? interaction.guild.channels.cache.get(oldVoiceId) ||
                          (await interaction.guild.channels.fetch(oldVoiceId).catch(() => null))
                        : null;
                    isOldChannelValid = oldChannel && oldChannel.type === coreLoader.ChannelType.GuildVoice;
                }

                const promptText =
                    !hasSetup || !isOldChannelValid
                        ? `**لا يوجد إعداد مسبق للبوت في هذا السيرفر.**\nهل تريد حفظ قناة <#${targetChannel.id}> كقناة افتراضية للبوت؟`
                        : `**البوت لديه بالفعل قناة افتراضية (<#${currentSetup.voiceChannelId}>).**\nهل تريد حفظ قناة <#${targetChannel.id}> كقناة افتراضية جديدة بدلاً منها؟`;

                await interaction.editReply({
                    components: buildPromptV2(promptText, targetChannel.id),
                    flags: 32832,
                });
            },
            { context: { label: 'join_channel_command', logger } },
        );
    },
};
