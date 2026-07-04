const time_constants = {
    // Azkar system timing
    azkar_interval_ms: 30 * 60 * 1000,
    azkar_max_retry_attempts: 5,
    azkar_retry_delay_ms: 2000,

    // HTTP request timeouts used via http.js TimeoutRequest
    stream_timeout_ms: 25000,
    request_timeout_ms: 45000,
    request_timeout_ms_30s: 30000,
    head_request_timeout_ms: 12000,

    // Rate limiting and cooldowns
    rate_limit_window_ms: 60000,
    max_clicks_per_minute: 30,
    interaction_rate_limit_ms: 500,

    // Cache and memory management
    interaction_cache_ttl_ms: 3000,
    memory_cleanup_interval_ms: 3 * 60 * 1000,
    memory_check_interval_ms: 30000,
    max_interaction_cache_size: 500,
    high_memory_threshold_mb: 250,
    max_concurrent_guilds: 10,

    // Persistence and state
    state_save_debounce_ms: 60000,
    embed_cache_ttl_ms: 30000,

    // Voice and error handling
    error_recovery_delay_ms: 5000,
    max_error_count: 5,

    // UI pagination (values used in components.js)
    reciters_per_page: 25,
    surah_options_per_page: 25,
    radio_items_per_page: 25,

    // Prayer times
    prayer_times_cache_ms: 3600000,

    // Statistics
    stats_update_interval_ms: 10000,

    // Logging
    log_max_file_size_mb: 50,
    log_max_files_keep: 10,
};

const limits = {
    // Memory and state limits
    max_guild_states_in_memory: 1000,
    max_cache_entries: 5000,

    // Logging limits
    max_log_file_size_mb: 50,
    max_log_files_to_keep: 10,

    // Interaction limits
    max_interaction_cache_size: 500,
    max_concurrent_guilds: 10,

    // Error handling
    max_error_count: 5,

    // Rate limiting
    max_clicks_per_minute: 30,
    max_retry_attempts: 3,

    // Memory threshold
    high_memory_threshold_mb: 250,

    // UI pagination
    reciters_per_page: 25,
    surah_options_per_page: 25,
    radio_items_per_page: 25,
};

const paths = {
    cache_file: 'storage/database/data_url.json',
    log_dir: 'storage/logs',
    data_dir: 'storage/data',
    backup_dir: 'storage/backups',
    database_dir: 'storage/database',
    storage_base: 'storage',
    core_dir: 'core',
    modules_dir: 'node_modules',
};

const urls = {
    adhkar_base_url: 'https://hub-mgv.github.io/QuranBotData',
    adhkar_images_base_url: 'https://hub-mgv.github.io/QuranBotData/azkar-images',
    adhkar_json_url: 'https://hub-mgv.github.io/QuranBotData/adhkar.json',
    mp3quran_api_base: 'https://www.mp3quran.net/api/v3',
    aladhan_api_base: 'https://api.aladhan.com/v1',
    api_endpoints: {
        surah: 'https://www.mp3quran.net/api/v3/suwar?language=ar',
        rewayah: 'https://www.mp3quran.net/api/v3/riwayat?language=ar',
        moshaf: 'https://www.mp3quran.net/api/v3/moshaf?language=ar',
        reciters: 'https://www.mp3quran.net/api/v3/reciters?language=ar',
        radios: 'https://www.mp3quran.net/api/v3/radios?language=ar',
        tafasir: 'https://www.mp3quran.net/api/v3/tafasir?language=ar',
    },
    reciter_urls: [
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

const cache_config = {
    interaction: { max_size: 500, ttl_ms: 3000 },
    embed: { ttl_ms: 30000, max_entries: 100 },
    data: { ttl_ms: 300000, file_path: 'storage/database/data_url.json' },
    dhikr: { ttl_ms: 300000, save_debounce_ms: 10000 },
    guild_state: { save_debounce_ms: 60000 },
};

const memory_config = {
    cleanup_interval_ms: 3 * 60 * 1000,
    check_interval_ms: 30000,
    high_threshold_mb: 250,
    critical_threshold_mb: 2000,
    gc_trigger_mb: 1500,
};

const voice_config = {
    bitrate: 64000,
    user_limit: 0,
    self_deaf: true,
    max_error_count: 5,
    error_recovery_delay_ms: 5000,
    log_level: 'debug',
    log_guild_specific: true,
};

const prayer_times_config = {
    cache_ms: 3600000,
    countries_count: 35,
    cities_per_page: 25,
    time_format_12h_countries: ['SA', 'EG', 'AE', 'KW', 'QA', 'BH', 'OM', 'JO', 'LB', 'SY', 'IQ', 'SD', 'YE', 'PS', 'PK', 'BD', 'US', 'CA'],
};

const logging_config = {
    dir: '../../storage/logs',
    max_file_size_mb: 50,
    max_files_to_keep: 10,
    levels: ['debug', 'info', 'warn', 'error', 'fatal'],
};

const permissions_config = {
    admin_roles: ['admin', 'quran admin', 'islamic admin', 'quran', 'islamic', 'islam'],
    special_user_env: 'SPE_USER_ID',
    required_setup_permissions: ['ManageChannels', 'ManageRoles', 'ViewChannel', 'Connect', 'Speak', 'ReadMessageHistory'],
};

const channel_names = {
    category: '🕋︱القُرآن الكريم',
    voice: '🕌︱بثّ القُرآن الكريم',
    text: '📖︱تحكم البوت القرآني',
    azkar: '🌙︱الأذكار',
};

const azkarSettings = {
    role: {
        name: 'الأذكار',
        reason: 'Azkar mention role auto created by QuranBot',
        colors: 0x000000,
        mentionable: true,
    },
};

const pagination = {
    default_items: 25,
    voice_channels_items: 10,
    server_list_items: 25,
    prayer_items: 25,
};

module.exports = {
    time_constants,
    limits,
    paths,
    urls,
    cache_config,
    memory_config,
    voice_config,
    prayer_times_config,
    logging_config,
    permissions_config,
    channel_names,
    azkarSettings,
    pagination,
};
