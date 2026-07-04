const logger = require('@logging/logger');

const userCD = new Map();
const serverCD = new Map();

const COMMAND_COOLDOWNS = {
    control: { duration: 10000, type: 'user' },
    guide: { duration: 5000, type: 'user' },
    join_channel: { duration: 7000, type: 'user' },
    join: { duration: 7000, type: 'user' },
    leave: { duration: 10000, type: 'user' },
    ping: { duration: 30000, type: 'user' },
    prayerTimes: { duration: 5000, type: 'user' },
    prayerTimesButton: { duration: 5000, type: 'user' },
    setup: { duration: 60000, type: 'server' },
    sources: { duration: 5000, type: 'user' },
    changelog: { duration: 15000, type: 'user' },
    help: { duration: 3000, type: 'user' },
};

//  control: { duration: 1000, type: 'user' },
//  guide: { duration: 1000, type: 'user' },
//  join_channel: { duration: 1000, type: 'user' },
//  join: { duration: 1000, type: 'user' },
//  leave: { duration: 1000, type: 'user' },
//  ping: { duration: 1000, type: 'user' },
//  prayerTimes: { duration: 1000, type: 'user' },
//  prayerTimesButton: { duration: 1000, type: 'user' },
//  setup: { duration: 1000, type: 'server' },
//  sources: { duration: 1000, type: 'user' },
//  changelog: { duration: 1000, type: 'user' },
//  help: { duration: 1000, type: 'user' },

const CMD_MAP = {
    تحكم: 'control',
    دليل: 'guide',
    دخول_قناة: 'join_channel',
    دخول: 'join',
    خروج: 'leave',
    سرعة: 'ping',
    مواقيت_الصلاة: 'prayerTimes',
    prayer_times: 'prayerTimesButton',
    إعداد: 'setup',
    مصادر: 'sources',
    تحديثات: 'changelog',
    مساعدة: 'help',
};

function getCmdKey(name) {
    return CMD_MAP[name] || name;
}

// check user cooldown
function checkUserCooldown(userId, cmdName) {
    const key = getCmdKey(cmdName);
    const cfg = COMMAND_COOLDOWNS[key];
    if (!cfg || cfg.type !== 'user') return { allowed: true, remaining: 0 };
    const cdKey = `${userId}:${key}`;
    const data = userCD.get(cdKey);
    if (!data) return { allowed: true, remaining: 0 };
    const elapsed = Date.now() - data.timestamp;
    if (elapsed < cfg.duration) {
        const rem = Math.ceil((cfg.duration - elapsed) / 1000);
        return { allowed: false, remaining: rem, duration: cfg.duration / 1000 };
    }
    userCD.delete(cdKey);
    return { allowed: true, remaining: 0 };
}

// set user cooldown
function setUserCooldown(userId, cmdName) {
    const key = getCmdKey(cmdName);
    const cfg = COMMAND_COOLDOWNS[key];
    if (!cfg || cfg.type !== 'user') return;
    userCD.set(`${userId}:${key}`, {
        timestamp: Date.now(),
        command: key,
        userId,
    });
    logger.user(`User CD set: ${userId} / ${key}`);
}

function checkServerCooldown(guildId, cmdName) {
    const key = getCmdKey(cmdName);
    const cfg = COMMAND_COOLDOWNS[key];
    if (!cfg || cfg.type !== 'server') return { allowed: true, remaining: 0 };
    const cdKey = `${guildId}:${key}`;
    const data = serverCD.get(cdKey);
    if (!data) return { allowed: true, remaining: 0 };
    const elapsed = Date.now() - data.timestamp;
    if (elapsed < cfg.duration) {
        const rem = Math.ceil((cfg.duration - elapsed) / 1000);
        return { allowed: false, remaining: rem, duration: cfg.duration / 1000 };
    }
    serverCD.delete(cdKey);
    return { allowed: true, remaining: 0 };
}

function setServerCooldown(guildId, cmdName) {
    const key = getCmdKey(cmdName);
    const cfg = COMMAND_COOLDOWNS[key];
    if (!cfg || cfg.type !== 'server') return;
    serverCD.set(`${guildId}:${key}`, {
        timestamp: Date.now(),
        command: key,
        guildId,
    });
    logger.debug(`Server CD set: ${guildId} / ${key}`);
}

// main check wrapper
function checkCooldown(userId, guildId, cmdName) {
    const key = getCmdKey(cmdName);
    const cfg = COMMAND_COOLDOWNS[key];
    if (!cfg) return { allowed: true, remaining: 0, type: 'none' };
    if (cfg.type === 'server') {
        const r = checkServerCooldown(guildId, key);
        return {
            allowed: r.allowed,
            remaining: r.remaining,
            duration: r.duration,
            type: 'server',
        };
    }
    const r = checkUserCooldown(userId, key);
    return { allowed: r.allowed, remaining: r.remaining, duration: r.duration, type: 'user' };
}

function setCooldown(userId, guildId, cmdName) {
    const key = getCmdKey(cmdName);
    const cfg = COMMAND_COOLDOWNS[key];
    if (!cfg) return;
    cfg.type === 'server' ? setServerCooldown(guildId, key) : setUserCooldown(userId, key);
}

function getUserCooldownMessage(sec) {
    return `يجب الانتظار ${sec} ثانية قبل استخدام هذا الأمر مرة أخرى`;
}

function getServerCooldownMessage(sec) {
    return `هذا الأمر في مهلة انتظار على السيرفر. الرجاء الانتظار ${sec} ثانية قبل استخدامه مرة أخرى`;
}

function getCooldownResponse(remaining, type) {
    return type === 'server' ? getServerCooldownMessage(remaining) : getUserCooldownMessage(remaining);
}

function clearUserCooldown(userId, cmdName) {
    userCD.delete(`${userId}:${getCmdKey(cmdName)}`);
}

function clearServerCooldown(guildId, cmdName) {
    serverCD.delete(`${guildId}:${getCmdKey(cmdName)}`);
}

function clearAllCooldowns() {
    userCD.clear();
    serverCD.clear();
    logger.info('All cooldowns cleared');
}

// stats
function getCooldownStats() {
    return { userCooldowns: userCD.size, serverCooldowns: serverCD.size };
}
let cleanupInterval = null;

function initCleanup() {
    if (cleanupInterval) clearInterval(cleanupInterval);
    cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [k, d] of userCD) {
            const cfg = COMMAND_COOLDOWNS[d.command];
            if (cfg && now - d.timestamp > cfg.duration) userCD.delete(k);
        }
        for (const [k, d] of serverCD) {
            const cfg = COMMAND_COOLDOWNS[d.command];
            if (cfg && now - d.timestamp > cfg.duration) serverCD.delete(k);
        }
    }, 60000);
    if (cleanupInterval && typeof cleanupInterval.unref === 'function') {
        cleanupInterval.unref();
    }
}

initCleanup();
function clearCleanupInterval() {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
    }
}

module.exports.checkUserCooldown = checkUserCooldown;
module.exports.setUserCooldown = setUserCooldown;
module.exports.checkServerCooldown = checkServerCooldown;
module.exports.setServerCooldown = setServerCooldown;
module.exports.checkCooldown = checkCooldown;
module.exports.setCooldown = setCooldown;
module.exports.getCooldownResponse = getCooldownResponse;
module.exports.getUserCooldownMessage = getUserCooldownMessage;
module.exports.getServerCooldownMessage = getServerCooldownMessage;
module.exports.clearUserCooldown = clearUserCooldown;
module.exports.clearServerCooldown = clearServerCooldown;
module.exports.clearAllCooldowns = clearAllCooldowns;
module.exports.getCooldownStats = getCooldownStats;
module.exports.COMMAND_COOLDOWNS = COMMAND_COOLDOWNS;
module.exports.CMD_MAP = CMD_MAP;
module.exports.clearCleanupInterval = clearCleanupInterval;
