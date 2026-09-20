const { wrapInteraction, safeError } = require('@infrastructure/Discord/Flow/DeferReply');
const { checkAuthorization, resolveGuildState } = require('@core/Auth/AuthGuard');
const logger = require('@infrastructure/Logging/Logger');
const { saveSetupGuildsToFirebase } = require('@infrastructure/Persistence/Firebase/FirebaseIndex');
const { assignSession } = require('@modules/Admin/Interactions/Helpers/AssignSession');
const { createControlEmbed } = require('@infrastructure/Discord/UI/Embeds');
const {
    createReciterRow,
    createRadioRow,
    createSelectRow,
    createButtonRow,
    createNavigationRow,
} = require('@infrastructure/Discord/UI/Components');
const { saveControlId } = require('@trackers/ControlIdsTracker');
const { startAzkarTimerForGuild } = require('@modules/Azkar/AzkarModule');
const {
    buildInitMessage,
    buildCategorySelect,
    buildReviewMessage,
    buildSuccessMessage,
} = require('@modules/Admin/Interactions/Helpers/AssignChannelsUI');
const { initializeConnection, createSurahResource, createRadioResource } = require('@modules/Audio/AudioModule');

module.exports = {
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const { guildId, guildState } = resolveGuildState(interaction);
                const authorized = await checkAuthorization(interaction, interaction.customId);

                if (!authorized) return;

                if (interaction.customId === 'assign_channels') {
                    const currentSetup = global.setupGuilds?.[guildId] || {};

                    const before = {
                        categoryId: currentSetup.categoryId,
                        textId: currentSetup.textChannelId,
                        azkarId: currentSetup.azkarChannelId,
                        voiceId: currentSetup.voiceChannelId,
                    };

                    assignSession.set(guildId, { step: 'init', before, after: {} });
                    await interaction.followUp({ components: buildInitMessage(before), flags: 32832 });
                } else if (interaction.customId === 'assign_start') {
                    const session = assignSession.get(guildId);
                    if (!session) return safeError(interaction, 'جلسة التعيين منتهية');

                    session.step = 'category';
                    await interaction.editReply({ components: buildCategorySelect(), flags: 32832 });
                } else if (interaction.customId === 'assign_save') {
                    const session = assignSession.get(guildId);

                    if (!session || !session.after.categoryId) return safeError(interaction, 'جلسة التعيين غير صالحة');
                    const { before, after } = session;

                    if (!global.setupGuilds) global.setupGuilds = {};
                    if (!global.setupGuilds[guildId]) global.setupGuilds[guildId] = {};

                    global.setupGuilds[guildId].categoryId = after.categoryId;
                    global.setupGuilds[guildId].textChannelId = after.textId;
                    global.setupGuilds[guildId].azkarChannelId = after.azkarId;
                    global.setupGuilds[guildId].voiceChannelId = after.voiceId;

                    await saveSetupGuildsToFirebase(global.setupGuilds);

                    const textChannel =
                        global.client.channels.cache.get(after.textId) ||
                        (await global.client.channels.fetch(after.textId).catch(() => null));

                    if (textChannel && textChannel.isTextBased()) {
                        const embed = createControlEmbed(guildState, guildId);
                        const rows = [];
                        if (guildState.playbackMode === 'surah') {
                            rows.push(createReciterRow(guildState), createSelectRow(guildState));
                        } else {
                            rows.push(createRadioRow(guildState));
                        }
                        rows.push(createButtonRow(guildState));
                        rows.push(...createNavigationRow(guildState, guildId));

                        const msg = await textChannel.send({ embeds: [embed], components: rows.slice(0, 5) }).catch(() => null);
                        if (msg) await saveControlId(guildId, textChannel.id, msg.id);
                    }
                    startAzkarTimerForGuild(guildId, after.azkarId, true);

                    if (guildState.channelId !== after.voiceId) {
                        const voiceChannel =
                            global.client.channels.cache.get(after.voiceId) ||
                            (await global.client.channels.fetch(after.voiceId).catch(() => null));
                        if (voiceChannel && voiceChannel.type === 2) {
                            await initializeConnection(guildId, guildState, voiceChannel, interaction.guild.voiceAdapterCreator);
                            if (
                                guildState.player &&
                                !guildState.player.destroyed &&
                                !guildState.player.playing &&
                                !guildState.player.paused
                            ) {
                                const track =
                                    guildState.playbackMode === 'surah'
                                        ? await createSurahResource(guildState, guildState.currentSurah - 1)
                                        : await createRadioResource(guildState.currentRadioUrl);
                                if (track) guildState.player.play({ track });
                            }
                        }
                    }

                    assignSession.delete(guildId);
                    await interaction.editReply({ components: buildSuccessMessage(), flags: 32832 });
                }
            },
            { context: { label: 'assign_channels_button', logger } },
        );
    },
};
