require('pathlra-aliaser');

const PLAYER_CONFIG = {
   NO_SUBSCRIBER_TIMEOUT: 60000,
   MAX_MISSED_FRAMES: 500,
   PLAYBACK_START_DELAY_MS: 2000,
   MAX_SURAH_ATTEMPTS: 10,
};

const CHANNEL_NAMES = {
   VOICE: '🕌︱بثّ القُرآن الكريم',
};

const ERRORS = {
   NO_SETUP: 'لم يتم إعداد فئة القرآن بعد استخدم setup أولا',
   NO_CHANNEL: 'القناة الصوتية قران كريم غير موجودة استخدم الامر setup لتجهيز كل شيء',
   NO_PERMISSIONS: 'البوت ليس لديه الصلاحيات الكاملة للانضمام إلى هذه الغرفة الصوتية',
   NOT_IN_VC: 'البوت غير موجود في غرفة صوتية حاليا',
   JOIN_FAILED: 'فشل في الانضمام ',
   ACTION_DENIED:
      'هذا الإجراء غير متاح للأعضاء العاديين في وضع الجميع فقط التنقل بين السور واختيار القارئ متاح مع تأخير 90 ثانية الأدمنز لديهم تحكم كامل',
   ADMIN_REQUIRED: 'تتطلب هذه العملية امتلاك صلاحيات المسؤول (Administrator)',
};

module.exports.PLAYER_CONFIG = PLAYER_CONFIG;
module.exports.CHANNEL_NAMES = CHANNEL_NAMES;
module.exports.ERRORS = ERRORS;
