const fs = require('fs').promises;
const pathlra = require('path');
const { logging_config } = require('@config/constants');
const {
    enqueueWrite,
    ensureDir,
    getCairoDate,
    archiveAllOldLogs,
    cleanupOldLogs,
    getDelayToNextCairoMidnight,
    writeToFile,
} = require('./logging-engine');
const BASE_LOG_DIR = pathlra.join(__dirname, logging_config.dir, 'voice');
const SERVER_DIR = pathlra.join(BASE_LOG_DIR, 'server');
const MAX_LOG_AGE_DAYS = 30;
const METADATA_FILE = 'metadata.json';
const guildMetadataCache = new Map();

function sanitizeGuildName(name) {
    if (!name || typeof name !== 'string') return 'unknown_guild';
    let clean = name
        .replace(/[\u064B-\u065B\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '')
        .replace(/[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
        .replace(/[^\w\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF-]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .trim()
        .toLowerCase();
    return clean || 'unknown_guild';
}

async function getGuildFolderName(guild) {
    if (!guild) return 'unknown_guild';
    const sanitizedName = sanitizeGuildName(guild.name);
    if (sanitizedName !== 'unknown_guild') return sanitizedName;
    try {
        const owner = await guild.fetchOwner().catch(() => null);
        if (owner?.user?.username) return sanitizeGuildName(`owner_${owner.user.username}`);
    } catch {}
    return `guild_${guild.id}`;
}

async function buildGuildMetadata(guild) {
    const owner = await guild.fetchOwner().catch(() => null);
    return {
        guildId: guild.id,
        guildName: guild.name,
        guildNameSanitized: sanitizeGuildName(guild.name),
        ownerId: owner?.id || 'unknown',
        ownerUsername: owner?.user?.username || 'unknown',
        ownerGlobalName: owner?.user?.globalName || owner?.user?.username || 'unknown',
        memberCount: guild.memberCount || 0,
        botJoinedAt: new Date().toISOString(),
        isActive: true,
        voiceEnabled: false,
        setupComplete: false,
        controlMode: 'admins',
    };
}
async function writeGuildMetadata(guildFolder, metadata) {
    try {
        await fs.writeFile(pathlra.join(SERVER_DIR, guildFolder, METADATA_FILE), JSON.stringify(metadata, null, 2), 'utf8');
    } catch {}
}

// get or create guild metadata, caching to avoid repeated fetches
async function getOrCreateGuildMetadata(guildId, guildCache = null) {
    if (guildMetadataCache.has(guildId)) return guildMetadataCache.get(guildId);
    if (global.client?.guilds?.cache) {
        const guild = guildCache?.get(guildId) || global.client.guilds.cache.get(guildId);
        if (guild) {
            const metadata = await buildGuildMetadata(guild);
            guildMetadataCache.set(guildId, metadata);
            return metadata;
        }
    }
    return {
        guildId,
        guildName: 'unknown',
        ownerId: 'unknown',
        botJoinedAt: new Date().toISOString(),
        isActive: true,
    };
}

async function ensureGuildMetadata(guildFolder, guildId, guildCache = null) {
    const metadataPath = pathlra.join(SERVER_DIR, guildFolder, METADATA_FILE);
    try {
        await fs.access(metadataPath);
    } catch {
        const metadata = await getOrCreateGuildMetadata(guildId, guildCache);
        await writeGuildMetadata(guildFolder, metadata);
    }
}

function getVoiceLogFilePath(level, guildFolder = null) {
    const date = getCairoDate().replace(/\//g, '-');
    const suffix =
        level === 'error' || level === 'fatal' ? 'errors' : level === 'warn' ? 'warnings' : level === 'debug' ? 'debug' : 'general';
    const prefix = guildFolder ? `${guildFolder}-` : '';
    return pathlra.join(SERVER_DIR, guildFolder || '', `${prefix}voice-${suffix}-${date}.log`);
}

// Recursively archive each server subfolder into its own archive directory
async function archiveVoiceLogsRecursively(baseDir, prefix) {
    try {
        const entries = await fs.readdir(baseDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = pathlra.join(baseDir, entry.name);
            if (entry.isDirectory() && entry.name !== 'archive') {
                await archiveAllOldLogs(fullPath, `${entry.name}-${prefix}`);
                await cleanupOldLogs(fullPath, MAX_LOG_AGE_DAYS);
            }
        }
    } catch (err) {
        console._originalError?.('Failed To Archive Voice Logs Recursively', err);
    }
}

async function checkAndArchiveVoiceStartup(baseDir) {
    try {
        await ensureDir(baseDir);
        await archiveVoiceLogsRecursively(baseDir, 'voice-logs-archive');
        scheduleVoiceNextArchive(baseDir);
    } catch (err) {
        console._originalError?.('Failed To Check And Archive Voice On Startup', err);
    }
}

let voiceArchiveScheduled = false;

function scheduleVoiceNextArchive(baseDir) {
    if (voiceArchiveScheduled) return;
    voiceArchiveScheduled = true;
    const delay = getDelayToNextCairoMidnight();
    setTimeout(async () => {
        try {
            await archiveVoiceLogsRecursively(baseDir, 'voice-logs-archive');
        } catch (err) {
            console._originalError?.('Scheduled Voice Archive Failed', err);
        } finally {
            voiceArchiveScheduled = false;
            scheduleVoiceNextArchive(baseDir);
        }
    }, delay);
}

async function writeVoiceLog(level, msg, meta = {}, guildFolder = null) {
    const ts = new Date().toISOString();
    await writeToFile(getVoiceLogFilePath(level, guildFolder), level, msg, meta, ts);
}

class VoiceLogger {
    async info(m, meta = {}, guildId = null, guildCache = null) {
        let folder = null;
        if (guildId && global.client?.guilds?.cache) {
            const guild = guildCache?.get(guildId) || global.client.guilds.cache.get(guildId);
            if (guild) {
                folder = await getGuildFolderName(guild);
                await ensureGuildMetadata(folder, guildId, guildCache);
                if (guildCache) guildCache.set(guildId, guild);
            }
        }
        return writeVoiceLog('info', m, meta, folder);
    }
    async warn(m, meta = {}, guildId = null, guildCache = null) {
        let folder = null;
        if (guildId && global.client?.guilds?.cache) {
            const guild = guildCache?.get(guildId) || global.client.guilds.cache.get(guildId);
            if (guild) {
                folder = await getGuildFolderName(guild);
                await ensureGuildMetadata(folder, guildId, guildCache);
                if (guildCache) guildCache.set(guildId, guild);
            }
        }
        return writeVoiceLog('warn', m, meta, folder);
    }
    async error(m, errObj = null, meta = {}, guildId = null, guildCache = null) {
        let folder = null;
        if (guildId && global.client?.guilds?.cache) {
            const guild = guildCache?.get(guildId) || global.client.guilds.cache.get(guildId);
            if (guild) {
                folder = await getGuildFolderName(guild);
                await ensureGuildMetadata(folder, guildId, guildCache);
                if (guildCache) guildCache.set(guildId, guild);
            }
        }
        const fullMeta = { ...meta };
        let fullMsg = m;
        if (errObj instanceof Error) {
            fullMsg = `${m} ${errObj.message}`;
            fullMeta.stack = errObj.stack?.split('\n').slice(0, 8).join('\n');
            fullMeta.name = errObj.name;
        } else if (errObj) fullMeta.reason = String(errObj);
        return writeVoiceLog('error', fullMsg, fullMeta, folder);
    }
    async fatal(m, errObj = null, meta = {}, guildId = null, guildCache = null) {
        return this.error(`FATAL ${m}`, errObj, { ...meta, isFatal: true }, guildId, guildCache);
    }
    async debug(m, meta = {}, guildId = null, guildCache = null) {
        let folder = null;
        if (guildId && global.client?.guilds?.cache) {
            const guild = guildCache?.get(guildId) || global.client.guilds.cache.get(guildId);
            if (guild) {
                folder = await getGuildFolderName(guild);
                await ensureGuildMetadata(folder, guildId, guildCache);
                if (guildCache) guildCache.set(guildId, guild);
            }
        }
        return writeVoiceLog('debug', m, meta, folder);
    }
    async connection(gid, msg, meta = {}, guildCache = null) {
        return this.debug(`[CONN] ${msg}`, meta, gid, guildCache);
    }
    async player(gid, msg, meta = {}, guildCache = null) {
        return this.debug(`[PLAYER] ${msg}`, meta, gid, guildCache);
    }
    async resource(gid, msg, meta = {}, guildCache = null) {
        return this.debug(`[RESOURCE] ${msg}`, meta, gid, guildCache);
    }
    async recovery(gid, msg, meta = {}, guildCache = null) {
        return this.debug(`[RECOVERY] ${msg}`, meta, gid, guildCache);
    }
    async stream(gid, msg, meta = {}, guildCache = null) {
        return this.debug(`[STREAM] ${msg}`, meta, gid, guildCache);
    }
    async getMetadata(guildId, guildCache = null) {
        return getOrCreateGuildMetadata(guildId, guildCache);
    }
}

const voiceLogger = new VoiceLogger();
(async () => {
    await ensureDir(BASE_LOG_DIR);
    await ensureDir(SERVER_DIR);
    await checkAndArchiveVoiceStartup(SERVER_DIR);
})();

module.exports = voiceLogger;
module.exports.sanitizeGuildName = sanitizeGuildName;
module.exports.getGuildFolderName = getGuildFolderName;
module.exports.buildGuildMetadata = buildGuildMetadata;
module.exports.getOrCreateGuildMetadata = getOrCreateGuildMetadata;
module.exports.guildMetadataCache = guildMetadataCache;
