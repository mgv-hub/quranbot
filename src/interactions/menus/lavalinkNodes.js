const { wrapInteraction } = require('@interactions/flow/deferReply');
const { resolveGuildState } = require('@auth/guard');
const { createStandardEmbed } = require('@ui/embedFactory');
const logger = require('@logging/logger');
const { initializeConnection, syncVoiceState, createSurahResource, createRadioResource } = require('@audio');
const { getNodeInfo, parseNodeConfig } = require('@config/lavalinkConfig');
const { emoji } = require('@helpers/emojis');

module.exports = {
    customId: 'select_lavalink_node',
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const selectedNodeId = interaction.values[0];
                const { guildId, guildState } = resolveGuildState(interaction);
                const client = require('@startup/botSetup').client;
                const nodeConfig = parseNodeConfig(selectedNodeId);
                const maxPlayers = nodeConfig?.maxPlayers || 100;

                const targetNode = client.lavalink.nodeManager.nodes.get(selectedNodeId);
                if (!targetNode || !targetNode.connected) {
                    await interaction.followUp({
                        content: 'العقدة المختارة غير متصلة حالياً. يرجى اختيار عقدة أخرى متاحة.',
                        flags: 64,
                    });
                    return;
                }
                const currentPlayers = Array.from(client.lavalink.players.values()).filter((p) => p.node?.id === selectedNodeId).length;

                if (currentPlayers >= maxPlayers) {
                    await interaction.followUp({
                        content: `العقدة المختارة ممتلئة بالكامل (${currentPlayers}/${maxPlayers})، يرجى اختيار عقدة أخرى أو الانتظار حتى يتوفر مقعد.`,
                        flags: 64,
                    });
                    return;
                }

                const currentNodeId = guildState.player?.node?.id || guildState.preferredLavalinkNode || null;
                if (currentNodeId === selectedNodeId) {
                    const nodeInfo = getNodeInfo(selectedNodeId);
                    await interaction.followUp({
                        content: `${emoji.check} **أنت متصل بالفعل بهذه العقدة:** ${nodeInfo.flag} \`${nodeInfo.location}\``,
                        flags: 64,
                    });
                    return;
                }

                const oldNode = guildState.preferredLavalinkNode || currentNodeId;
                guildState.preferredLavalinkNode = selectedNodeId;
                let actualNodeId = selectedNodeId;
                let migrationFailed = false;

                if (guildState.player && !guildState.player.destroyed && guildState.channelId) {
                    try {
                        const targetChannelId = guildState.channelId;
                        const currentPosition = guildState.player.position || 0;
                        const wasPaused = guildState.player.paused || false;
                        const mode = guildState.playbackMode;
                        const targetChannel =
                            interaction.guild.channels.cache.get(targetChannelId) ||
                            (await interaction.guild.channels.fetch(targetChannelId).catch(() => null));

                        if (targetChannel) {
                            const joinResult = await initializeConnection(
                                guildId,
                                guildState,
                                targetChannel,
                                interaction.guild.voiceAdapterCreator,
                            );
                            if (joinResult.success) {
                                if (!guildState.player || guildState.player.destroyed) {
                                    migrationFailed = true;
                                } else {
                                    actualNodeId = guildState.player.node?.id || selectedNodeId;
                                    let track = null;
                                    if (mode === 'surah') {
                                        track = await createSurahResource(guildState, guildState.currentSurah - 1);
                                    } else if (mode === 'radio' && guildState.currentRadioUrl) {
                                        track = await createRadioResource(guildState.currentRadioUrl);
                                    }
                                    if (track) {
                                        if (!guildState.player || guildState.player.destroyed) {
                                            migrationFailed = true;
                                        } else {
                                            await guildState.player.play({ track });
                                            if (mode === 'surah' && currentPosition > 0) {
                                                await guildState.player.seek(currentPosition).catch(() => {});
                                            }
                                            if (wasPaused) await guildState.player.pause(true).catch(() => {});
                                        }
                                    }
                                    await syncVoiceState(guildId, guildState);
                                    if (typeof global.saveRuntimeStates === 'function') await global.saveRuntimeStates();
                                }
                            } else {
                                migrationFailed = true;
                            }
                        }
                    } catch (err) {
                        logger.error(`Lavalink node migration failed for guild ${guildId}`, err);
                        migrationFailed = true;
                    }
                } else {
                    if (typeof global.saveRuntimeStates === 'function') await global.saveRuntimeStates();
                }

                const selectedInfo = getNodeInfo(actualNodeId);
                const oldInfo = oldNode ? getNodeInfo(oldNode) : { location: 'تحديد تلقائي', flag: `${emoji.screenRotation}` };
                let resultText = `${emoji.check} **تم التوجيه إلى:** ${selectedInfo.flag} \`${selectedInfo.location}\``;

                if (actualNodeId !== selectedNodeId) {
                    resultText += `\n**تنبيه:** العقدة المطلوبة كانت غير متاحة، تم التحويل التلقائي إلى عقدة أخرى لضمان استمرار الاتصال.`;
                }
                if (oldNode && actualNodeId !== oldNode) {
                    resultText += `\n${emoji.screenRotation} **تم الانتقال من:** ${oldInfo.flag} \`${oldInfo.location}\``;
                }
                resultText += `\nسيتم توجيه جميع اتصالات الصوت الجديدة إلى هذه العقدة لضمان أفضل أداء.`;

                const components = [
                    {
                        type: 17,
                        accent_color: 0xfefdfe,
                        components: [
                            {
                                type: 10,
                                content: `### ${migrationFailed ? `فشل تغيير العقدة الصوتية` : `تم تغيير العقدة الصوتية بنجاح`}\n${resultText}`,
                            },
                        ],
                    },
                ];

                await interaction.followUp({
                    components,
                    flags: 32832,
                });
            },
            { context: { label: 'select_lavalink_node_menu', logger } },
        );
    },
};
