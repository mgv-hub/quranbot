require('pathlra-aliaser')();

const PATH_BASE = '../../storage';

const TIME_CONSTANTS = {
   RADIO_CHECK_INTERVAL_MS: 30 * 60 * 1000,
   RADIO_CHECK_TIMEOUT_MS: 8000,
   AZKAR_INTERVAL_MS: 30 * 60 * 1000,
   AZKAR_EXPIRY_MS: 10 * 24 * 60 * 1000,
   STREAM_TIMEOUT_MS: 15000,
   REQUEST_TIMEOUT_MS: 30000,
   HEAD_REQUEST_TIMEOUT_MS: 8000,
   RETRY_DELAY_MS: 2000,
   MAX_RETRY_ATTEMPTS: 3,
   CACHE_TTL_MS: 300000,
   COOLDOWN_MS: 3000,
   RATE_LIMIT_WINDOW_MS: 60000,
   MAX_CLICKS_PER_MINUTE: 30,
   SAVE_DEBOUNCE_MS: 10000,
   INTERACTION_CACHE_TTL_MS: 3000,
   MEMORY_CLEANUP_INTERVAL_MS: 3 * 60 * 1000,
   MEMORY_CHECK_INTERVAL_MS: 30000,
   STATS_UPDATE_INTERVAL_MS: 10000,
   BACKUP_INTERVAL_MS: 5 * 60 * 1000,
   STATE_SAVE_DEBOUNCE_MS: 60000,
   EMBED_CACHE_TTL_MS: 30000,
   DELAY_BETWEEN_BATCHES_MS: 1000,
   MIN_UPTIME_MS: 60000,
   ERROR_RECOVERY_DELAY_MS: 5000,
   MAX_ERROR_COUNT: 5,
   MAX_FFMPEG_PARALLEL: 3,
   MAX_CONCURRENT_GUILDS: 10,
   MAX_INTERACTION_CACHE_SIZE: 500,
   HIGH_MEMORY_THRESHOLD_MB: 250,
   RADIO_BATCH_SIZE: 10,
   RECITERS_PER_PAGE: 25,
   SURAH_OPTIONS_PER_PAGE: 25,
   RADIO_ITEMS_PER_PAGE: 25,
   LEADERBOARD_LIMIT: 10,
   TOP_USERS_LIMIT: 5,
   DHIKR_CACHE_TTL_MS: 300000,
   DHIKR_SAVE_DEBOUNCE_MS: 10000,
   GUILD_STATE_SAVE_DEBOUNCE_MS: 60000,
   INTERACTION_RATE_LIMIT_MS: 500,
   VOICE_COOLDOWN_MS: 5000,
   COMMAND_COOLDOWN_MS: 3000,
   GLOBAL_COOLDOWN_MS: 200000,
   AZKAR_MAX_RETRY_ATTEMPTS: 5,
   AZKAR_RETRY_DELAY_MS: 2000,
   PRAYER_TIMES_CACHE_MS: 3600000,
   RADIO_HEALTH_CHECK_MS: 30 * 60 * 1000,
   RADIO_HEALTH_TIMEOUT_MS: 8000,
   STATE_RESTORE_DELAY_MS: 500,
   BACKUP_MAX_KEEP: 5,
   LOG_MAX_FILE_SIZE_MB: 50,
   LOG_MAX_FILES_KEEP: 10,
   CACHE_MAX_ENTRIES: 5000,
   GUILD_STATES_MAX_MEMORY: 1000,
   VOICE_CONNECTIONS_MAX_PER_SHARD: 50,
};

const LIMITS = {
   MAX_VOICE_CONNECTIONS_PER_SHARD: 50,
   MAX_GUILD_STATES_IN_MEMORY: 1000,
   MAX_CACHE_ENTRIES: 5000,
   MAX_LOG_FILE_SIZE_MB: 50,
   MAX_LOG_FILES_TO_KEEP: 10,
   MAX_INTERACTION_CACHE_SIZE: 500,
   MAX_CONCURRENT_GUILDS: 10,
   MAX_FFMPEG_PARALLEL: 3,
   MAX_ERROR_COUNT: 5,
   MAX_CLICKS_PER_MINUTE: 30,
   MAX_RETRY_ATTEMPTS: 3,
   HIGH_MEMORY_THRESHOLD_MB: 250,
   RECITERS_PER_PAGE: 25,
   SURAH_OPTIONS_PER_PAGE: 25,
   RADIO_ITEMS_PER_PAGE: 25,
   LEADERBOARD_LIMIT: 10,
   TOP_USERS_LIMIT: 5,
   RADIO_BATCH_SIZE: 10,
};

const PATHS = {
   CACHE_FILE: 'storage/database/data_url.json',
   LOG_DIR: 'storage/logs',
   DATA_DIR: 'storage/data',
   BACKUP_DIR: 'storage/backups',
   DATABASE_DIR: 'storage/database',
   STORAGE_BASE: 'storage',
   CORE_DIR: 'core',
   MODULES_DIR: 'node_modules',
};

const URLs = {
   ADHKAR_BASE_URL: 'https://hub-mgv.github.io/QuranBotData',
   ADHKAR_IMAGES_BASE_URL: 'https://hub-mgv.github.io/QuranBotData/azkar-images',
   ADHKAR_JSON_URL: 'https://hub-mgv.github.io/QuranBotData/adhkar.json',
   MP3QURAN_API_BASE: 'https://www.mp3quran.net/api/v3',
   ALADHAN_API_BASE: 'https://api.aladhan.com/v1',
   API_ENDPOINTS: {
      surah: 'https://www.mp3quran.net/api/v3/suwar?language=ar',
      rewayah: 'https://www.mp3quran.net/api/v3/riwayat?language=ar',
      moshaf: 'https://www.mp3quran.net/api/v3/moshaf?language=ar',
      reciters: 'https://www.mp3quran.net/api/v3/reciters?language=ar',
      radios: 'https://www.mp3quran.net/api/v3/radios?language=ar',
      tafasir: 'https://www.mp3quran.net/api/v3/tafasir?language=ar',
   },
   RECITER_URLS: [
      'https://hub-mgv.github.io/QuranBotData/quran/Al_Ashri_Omran.json',
      'https://hub-mgv.github.io/QuranBotData/quran/Al_Ayun_Al_Koshi.json',
      'https://hub-mgv.github.io/QuranBotData/quran/Al_Fateh_Mohammad_Al_Zubair.json',
      'https://hub-mgv.github.io/QuranBotData/quran/badr_al_turki.json',
      'https://hub-mgv.github.io/QuranBotData/quran/bandar_balilah.json',
      'https://hub-mgv.github.io/QuranBotData/quran/jamaan_alosaimi.json',
      'https://hub-mgv.github.io/QuranBotData/quran/jamal_shaker_abdullah.json',
      'https://hub-mgv.github.io/QuranBotData/quran/junaid_adam_abdullah.json',
      'https://hub-mgv.github.io/QuranBotData/quran/peshawa_qadir_quran.json',
      'https://hub-mgv.github.io/QuranBotData/quran/tawfiq_al_sayegh.json',
      'https://hub-mgv.github.io/QuranBotData/quran/Yasin_Qari.json',
      'https://hub-mgv.github.io/QuranBotData/quran/Zain_Mohammad_Ahmed.json',
      'https://hub-mgv.github.io/QuranBotData/quran/ahmad_al_hawashi.json',
      'https://hub-mgv.github.io/QuranBotData/quran/ahmad_al_hudhayfi.json',
      'https://hub-mgv.github.io/QuranBotData/quran/ahmad_al_suwaylim.json',
      'https://hub-mgv.github.io/QuranBotData/quran/ahmad_al_tarabulsi.json',
   ],
};

const COLORS = {
   EMBED_DEFAULT: 0x1e1f22,
   EMBED_SUCCESS: 0x57f287,
   EMBED_ERROR: 0xed4245,
   EMBED_WARNING: 0xfea745,
   EMBED_INFO: 0x5865f2,
};

const MODES = {
   PLAYBACK_SURAH: 'surah',
   PLAYBACK_RADIO: 'radio',
   CONTROL_ADMINS: 'admins',
   CONTROL_EVERYONE: 'everyone',
};

const STATUS = {
   ONLINE: 'online',
   IDLE: 'idle',
   DND: 'dnd',
   INVISIBLE: 'invisible',
};

const COOLDOWN_TYPES = {
   COMMAND: 'command',
   VOICE: 'voice',
   RATE_LIMIT: 'rate_limit',
   INTERACTION: 'interaction',
};

const CACHE_CONFIG = {
   INTERACTION: {
      MAX_SIZE: 500,
      TTL_MS: 3000,
   },
   EMBED: {
      TTL_MS: 30000,
      MAX_ENTRIES: 100,
   },
   DATA: {
      TTL_MS: 300000,
      FILE_PATH: 'storage/database/data_url.json',
   },
   DHIKR: {
      TTL_MS: 300000,
      SAVE_DEBOUNCE_MS: 10000,
   },
   GUILD_STATE: {
      SAVE_DEBOUNCE_MS: 60000,
   },
};

const MEMORY_CONFIG = {
   CLEANUP_INTERVAL_MS: 3 * 60 * 1000,
   CHECK_INTERVAL_MS: 30000,
   HIGH_THRESHOLD_MB: 250,
   CRITICAL_THRESHOLD_MB: 2000,
   GC_TRIGGER_MB: 1500,
};

const VOICE_CONFIG = {
   MAX_CONNECTIONS_PER_SHARD: 50,
   BITRATE: 64000,
   USER_LIMIT: 0,
   SELF_DEAF: true,
   MAX_ERROR_COUNT: 5,
   ERROR_RECOVERY_DELAY_MS: 5000,
};

const AZKAR_CONFIG = {
   INTERVAL_MS: 30 * 60 * 1000,
   EXPIRY_MS: 10 * 24 * 60 * 1000,
   MAX_RETRY_ATTEMPTS: 5,
   RETRY_DELAY_MS: 2000,
   FORCE_IMAGE_CHANCE: 0.5,
};

const RADIO_CONFIG = {
   CHECK_INTERVAL_MS: 30 * 60 * 1000,
   CHECK_TIMEOUT_MS: 8000,
   BATCH_SIZE: 10,
   DELAY_BETWEEN_BATCHES_MS: 1000,
   MIN_UPTIME_MS: 60000,
   ITEMS_PER_PAGE: 25,
};

const PRAYER_TIMES_CONFIG = {
   CACHE_MS: 3600000,
   COUNTRIES_COUNT: 35,
   CITIES_PER_PAGE: 25,
   TIME_FORMAT_12H_COUNTRIES: [
      'SA',
      'EG',
      'AE',
      'KW',
      'QA',
      'BH',
      'OM',
      'JO',
      'LB',
      'SY',
      'IQ',
      'SD',
      'YE',
      'PS',
      'PK',
      'BD',
      'US',
      'CA',
   ],
};

const LOGGING_CONFIG = {
   DIR: '../../storage/logs',
   MAX_FILE_SIZE_MB: 50,
   MAX_FILES_TO_KEEP: 10,
   LEVELS: ['debug', 'info', 'warn', 'error', 'fatal'],
};

const BACKUP_CONFIG = {
   INTERVAL_MS: 5 * 60 * 1000,
   MAX_KEEP: 5,
   DIR: 'storage/backups',
};

const STATISTICS_CONFIG = {
   UPDATE_INTERVAL_MS: 10000,
   PATH: 'bot_statistics',
   METRICS: [
      'totalServers',
      'recitations',
      'versesSent',
      'commandsUsed',
      'activeToday',
      'azkarSent',
      'uptime',
      'voiceConnections',
   ],
};

const FIREBASE_CONFIG = {
   PATHS: {
      SETUP_GUILDS: 'setup_guilds',
      GUILD_STATES: 'guild_states',
      CONTROL_IDS: 'control_ids',
      CACHED_DATA: 'cached_data',
      COMPLAINTS: 'complaints',
      COMPLAINT_COOLDOWNS: 'complaint_cooldowns',
      TRACKED_GUILDS: 'tracked_guilds',
      BACKUP: 'backup',
      STATISTICS: 'bot_statistics',
   },
   MAX_CONNECTION_ATTEMPTS: 5,
   RECONNECT_DELAY_MS: 2000,
};

const HTTP_CONFIG = {
   DEFAULT_USER_AGENT:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
   BOT_USER_AGENT:
      'Mozilla/5.0 (compatible; QuranBot/0.7.29; +https://github.com/mgv-hub/quranbot)',
   AUDIO_ACCEPT_HEADER: 'audio/*, */*;q=0.8',
   JSON_ACCEPT_HEADER: 'application/json, text/plain, */*',
   HTML_ACCEPT_HEADER:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
   REQUEST_TIMEOUT_MS: 15000,
   HEAD_REQUEST_TIMEOUT_MS: 8000,
   STREAM_TIMEOUT_MS: 30000,
};

const PERMISSIONS_CONFIG = {
   ADMIN_ROLES: ['admin', 'quran admin', 'islamic admin', 'quran', 'islamic', 'islam'],
   SPECIAL_USER_ENV: 'SPE_USER_ID',
   REQUIRED_SETUP_PERMISSIONS: [
      'ManageChannels',
      'ManageRoles',
      'ViewChannel',
      'Connect',
      'Speak',
   ],
};

const CHANNEL_NAMES = {
   CATEGORY: '🕋︱القُرآن الكريم',
   VOICE: '🕌︱بثّ القُرآن الكريم',
   TEXT: '📖︱تحكم البوت القرآني',
   AZKAR: '🌙︱الأذكار',
};

const VERSION_INFO = {
   VERSION: '0.8.00',
   LAST_UPDATED: 'March 2026',
   STATUS: 'Production Ready',
};

module.exports.TIME_CONSTANTS = TIME_CONSTANTS;
module.exports.LIMITS = LIMITS;
module.exports.PATHS = PATHS;
module.exports.URLs = URLs;
module.exports.COLORS = COLORS;
module.exports.MODES = MODES;
module.exports.STATUS = STATUS;
module.exports.COOLDOWN_TYPES = COOLDOWN_TYPES;
module.exports.CACHE_CONFIG = CACHE_CONFIG;
module.exports.MEMORY_CONFIG = MEMORY_CONFIG;
module.exports.VOICE_CONFIG = VOICE_CONFIG;
module.exports.AZKAR_CONFIG = AZKAR_CONFIG;
module.exports.RADIO_CONFIG = RADIO_CONFIG;
module.exports.PRAYER_TIMES_CONFIG = PRAYER_TIMES_CONFIG;
module.exports.LOGGING_CONFIG = LOGGING_CONFIG;
module.exports.BACKUP_CONFIG = BACKUP_CONFIG;
module.exports.STATISTICS_CONFIG = STATISTICS_CONFIG;
module.exports.FIREBASE_CONFIG = FIREBASE_CONFIG;
module.exports.HTTP_CONFIG = HTTP_CONFIG;
module.exports.PERMISSIONS_CONFIG = PERMISSIONS_CONFIG;
module.exports.CHANNEL_NAMES = CHANNEL_NAMES;
module.exports.VERSION_INFO = VERSION_INFO;
