const logger = require('@logging/logger');
const persistentState = require('@state/PersistentStateManager');
const { initializeConnection, teardownConnection, syncVoiceState } = require('@audio');
const { getVoiceChannel, checkBotPermissions } = require('@interactions/buttons/sys-voice');
const { startPlayback } = require('@interactions/buttons/sys-playback');
const { ERRORS } = require('@interactions/buttons/sys-config');

async function joinVoiceChannelHandler(interaction, guildId, guildState) {
    const targetGuild = interaction.guild;
    const guildSetup = global.setupGuilds ? global.setupGuilds[guildId] : null;

    const channelLookup = await getVoiceChannel(targetGuild, guildSetup, guildState);
    if (!channelLookup.channel) {
        return { success: false, error: channelLookup.error };
    }
    const { channel: targetVoiceChannel, channelId: targetChannelId } = channelLookup;

    if (!checkBotPermissions(targetVoiceChannel, targetGuild.members.me)) {
        return { success: false, error: ERRORS.NO_PERMISSIONS };
    }

    try {
        const joinResult = await initializeConnection(guildId, guildState, targetVoiceChannel, targetGuild.voiceAdapterCreator);
        if (!joinResult.success) {
            return { success: false, error: ERRORS.JOIN_FAILED };
        }

        if (guildState.playbackMode === 'surah') {
            const availableReciters = Object.keys(global.reciters || {});
            guildState.currentReciter = availableReciters[Math.floor(Math.random() * availableReciters.length)];
            guildState.currentSurah = Math.floor(Math.random() * 114) + 1;
        } else {
            guildState.playbackMode = 'radio';
            if (!guildState.currentRadioUrl && global.quranRadios?.length) {
                guildState.currentRadioIndex = guildState.currentRadioIndex ?? 0;
                guildState.currentRadioUrl = global.quranRadios[guildState.currentRadioIndex]?.url || global.quranRadios[0].url;
            }
        }
        const playSuccess = await startPlayback(guildState, guildId);
        if (!playSuccess && guildState.playbackMode === 'radio') {
            guildState.playbackMode = 'surah';
            await startPlayback(guildState, guildId);
        }
        await syncVoiceState(guildId, guildState);

        if (!global.setupGuilds) global.setupGuilds = {};
        if (!global.setupGuilds[guildId]) {
            global.setupGuilds[guildId] = { voiceChannelId: targetChannelId };
        }
        return { success: true, voiceChannelId: targetChannelId };
    } catch (err) {
        if (err.message && err.message.includes('maximum player capacity')) {
            logger.warn('Guild ' + guildId + ' Join failed: Lavalink nodes at max capacity');
            await teardownConnection(guildId, guildState);
            return { success: false, error: 'جميع الخوادم الصوتية ممتلئة حالياً، يرجى المحاولة لاحقاً' };
        }
        logger.error('Error Joining Via Button In Guild ' + guildId, err);
        await teardownConnection(guildId, guildState);
        return { success: false, error: ERRORS.JOIN_FAILED + ' ' + err.message };
    }
}

module.exports.joinVoiceChannelHandler = joinVoiceChannelHandler;
