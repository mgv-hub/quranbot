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

const exempt_prefixes = [
    'notify_',
    'tafseer_',
    'search_',
    'tasbih_',
    'prayer_',
    'pr_reminder_',
    'download_backup_',
    'spread_bot',
    'save_join_channel_',
    'temp_join_channel_',
    'assign_',
];

const exempt_exact = [
    'select_country_prayer',
    'select_city_prayer',
];

function isBotInVoice(gs) {
    if (!gs?.channelId) return false;
    const hasConnection = gs.connection && !gs.connection.destroyed;
    const hasPlayer = gs.player && !gs.player.destroyed;
    const hasRaw = !!gs.rawConnection;
    return hasConnection || hasPlayer || hasRaw;
}

function isAllowedWithoutVoice(actionId) {
    if (!actionId) return false;
    for (const prefix of exempt_prefixes) {
        if (actionId.startsWith(prefix)) return true;
    }
    if (exempt_exact.includes(actionId)) return true;
    return allowed_when_not_in_voice.includes(actionId);
}

// Block playback actions if bot not in voice, unless action is whitelisted
async function requireVoiceChannel(ixn, gs, actionId) {
    // Skip check for exempt actions or if bot already connected
    if (isBotInVoice(gs) || isAllowedWithoutVoice(actionId)) return true;

    await ixn.deferUpdate().catch(() => {});
    await ixn
        .followUp({
            content:
                'البوت غير موجود في غرفة صوتية حالياً. يجب الضغط على زر دخول أولاً للانضمام إلى الغرفة الصوتية قبل استخدام أي ميزة أخرى',
            flags: 64,
        })
        .catch(() => {});
    return false;
}

module.exports.isBotInVoice = isBotInVoice;
module.exports.isAllowedWithoutVoice = isAllowedWithoutVoice;
module.exports.requireVoiceChannel = requireVoiceChannel;
module.exports.allowed_when_not_in_voice = allowed_when_not_in_voice;
