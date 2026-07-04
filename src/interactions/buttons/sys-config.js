const { channel_names } = require('@config/constants');

const player_config = {
    no_subscriber_timeout: 60000,
    max_missed_frames: 500,
    playback_start_delay_ms: 2000,
    max_surah_attempts: 10,
};
module.exports.channel_names = channel_names;

const ERRORS = {
    NO_SETUP: 'لم يتم إعداد فئة القرآن بعد استخدم setup أولا',
    NO_PERMISSIONS:
        'البوت لا يملك الصلاحيات الكافية للانضمام أو التحدث في هذه الغرفة الصوتية تأكد من منح البوت صلاحيات الاتصال والتحدث، والتأكد أيضًا من أنه غير مكتوم (Server Mute) داخل الغرفة إذا كان البوت في وضع Deafen فقط فهذا لا يؤثر. بعد تعديل الصلاحيات يُرجى جعل البوت يخرج ثم يدخل مرة أخرى لتحديث صلاحياته الصوتية',
    NOT_IN_VC: 'البوت غير موجود في غرفة صوتية حاليا',
    JOIN_FAILED: 'فشل في الانضمام ',
    ACTION_DENIED:
        'هذا الإجراء غير متاح للأعضاء العاديين في وضع الجميع فقط التنقل بين السور واختيار القارئ متاح مع تأخير 90 ثانية الأدمنز لديهم تحكم كامل',
    ADMIN_REQUIRED: 'تتطلب هذه العملية امتلاك صلاحيات المسؤول (Administrator)',
};
module.exports.player_config = player_config;
module.exports.ERRORS = ERRORS;
