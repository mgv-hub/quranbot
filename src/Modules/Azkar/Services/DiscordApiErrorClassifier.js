function categorizeDiscordError(err) {
    if (!err) return 'UNKNOWN';
    const code = err.code || err.message;
    if (code === 10003 || code === 10008 || code === 'Unknown Channel' || code === 'Unknown Message') return 'UNKNOWN_CHANNEL';
    if (code === 50013 || code === 50001) return 'MISSING_PERMISSIONS';
    if (code === 429) return 'RATE_LIMIT';
    if (code === 503 || err.message?.includes('ETIMEDOUT') || err.message?.includes('ECONNRESET')) return 'TRANSIENT';
    return 'OTHER';
}

module.exports.categorizeDiscordError = categorizeDiscordError;                                                                                                                     
