// List of interaction types allowed even when bot is not in a voice channel
const allowed_when_not_in_voice = [
    'join_vc',
    'leave_vc',
    'submit_complaint',
    'open_complaint_modal',
    'cancel_support',
    'more_features',
    'back_to_main',
    'webhook_azkar_info',
    'check_hafsat',
    'stop_webhook',
    'register_webhook',
    'toggle_control_mode',
];
/**
 function isBotInVoice(guildState) {
     return !!
     (guildState?.connection &&
     !guildState.connection.destroyed &&
     guildState.channelId);
 }
 old:
 function isBotInVoice(guildState) {
    return !!(guildState?.connection && !guildState.connection.destroyed && guildState.channelId);
}
 */
function isBotInVoice(guildState) {
    const hasConnection = guildState?.connection && !guildState.connection.destroyed;
    const hasPlayer = guildState?.player && !guildState.player.destroyed;
    const hasChannel = guildState?.channelId;
    return (hasConnection || hasPlayer) && hasChannel;
}

function isAllowedWithoutVoice(interactionType) {
    if (interactionType && interactionType.startsWith('notify_')) return true;
    if (interactionType && interactionType.startsWith('tafseer_')) return true;
    if (interactionType && interactionType.startsWith('search_')) return true;
    if (interactionType && interactionType.startsWith('tasbih_')) return true;
    if (interactionType && interactionType.startsWith('prayer_')) return true;
    if (interactionType && interactionType.startsWith('download_backup_')) return true;
    if (interactionType === 'select_country_prayer' || interactionType === 'select_city_prayer') return true;
    if (interactionType && interactionType.startsWith('spread_bot')) return true;
    if (interactionType && interactionType.startsWith('save_join_channel_')) return true;
    if (interactionType && interactionType.startsWith('temp_join_channel_')) return true;
    if (interactionType && interactionType.startsWith('assign_')) return true;
    return allowed_when_not_in_voice.includes(interactionType);
}

// Validate that the bot is in a voice channel before allowing playback-related interactions
async function checkVoiceState(interaction, guildState, interactionType) {
    const isActuallyInVoice = isBotInVoice(guildState);

    if (!isActuallyInVoice && !isAllowedWithoutVoice(interactionType)) {
        await interaction.deferUpdate().catch(() => {});

        await interaction
            .followUp({
                content:
                    'البوت غير موجود في غرفة صوتية حالياً. يجب الضغط على زر دخول أولاً للانضمام إلى الغرفة الصوتية قبل استخدام أي ميزة أخرى',
                flags: 64,
            })
            .catch(() => {});
        return false;
    }

    return true;
}

module.exports.isBotInVoice = isBotInVoice;
module.exports.isAllowedWithoutVoice = isAllowedWithoutVoice;
module.exports.checkVoiceState = checkVoiceState;
module.exports.allowed_when_not_in_voice = allowed_when_not_in_voice;
