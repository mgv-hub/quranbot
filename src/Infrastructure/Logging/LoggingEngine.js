const fs = require('fs').promises;
const fsSync = require('fs');
const pathlra = require('path');
const archiverModule = require('archiver'); // Only, Only, Only version archiver v5.3.2
const archiver = archiverModule.default || archiverModule;

let writeQueue = [];
let isWriting = false;

async function enqueueWrite(fn) {
    return new Promise((res, rej) => {
        writeQueue.push({ fn, resolve: res, reject: rej });
        processQueue();
    });
}

async function processQueue() {
    if (isWriting || !writeQueue.length) return;
    isWriting = true;
    const { fn, resolve, reject } = writeQueue.shift();
    try {
        resolve(await fn());
    } catch (err) {
        try {
            console._originalError?.('Logger Internal Error');
        } catch {
            console.error('Logger Internal Error');
        }
        reject(err);
    } finally {
        isWriting = false;
        if (writeQueue.length) processQueue();
    }
}

async function ensureDir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
        await fs.mkdir(pathlra.join(dir, 'archive'), { recursive: true });
    } catch {}
}

function getCairoDate() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
}

// Only collect .log files directly in dir, skip subdirectories to isolate archiving per folder
async function collectLogFiles(dir) {
    const results = [];
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) continue;
            if (entry.name.endsWith('.log') && !entry.name.includes('archive')) {
                results.push({ path: pathlra.join(dir, entry.name), name: entry.name });
            }
        }
    } catch {}
    return results;
}

async function archiveLogFilesForDate(baseDir, dateStr, archivePrefix) {
    try {
        await ensureDir(baseDir);
        const allLogs = await collectLogFiles(baseDir);
        const files = allLogs.filter((f) => {
            const m = f.name.match(/\d{4}-\d{2}-\d{2}/);
            return m && m[0] === dateStr;
        });
        if (!files.length) return false;

        const archiveDir = pathlra.join(baseDir, 'archive');
        await fs.mkdir(archiveDir, { recursive: true });
        const outPath = pathlra.join(archiveDir, `${archivePrefix}-${dateStr}.zip`);

        const output = fsSync.createWriteStream(outPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(output);
        for (const f of files) archive.file(f.path, { name: pathlra.basename(f.path) });
        await archive.finalize();
        await new Promise((res, rej) => {
            output.on('close', res);
            output.on('error', rej);
        });
        for (const f of files)
            try {
                await fs.unlink(f.path);
            } catch {}
        return true;
    } catch (err) {
        try {
            console._originalError?.('Failed To Archive Log Files For Date ' + dateStr, err);
        } catch {
            console.error('Failed To Archive Log Files For Date ' + dateStr, err);
        }
        return false;
    }
}

async function archiveAllOldLogs(baseDir, archivePrefix) {
    try {
        await ensureDir(baseDir);
        const today = getCairoDate();
        const allLogs = await collectLogFiles(baseDir);
        const datesToArchive = new Set();
        for (const f of allLogs) {
            const m = f.name.match(/\d{4}-\d{2}-\d{2}/);
            if (m && m[0] !== today) datesToArchive.add(m[0]);
        }
        let count = 0;
        for (const d of datesToArchive) {
            if (await archiveLogFilesForDate(baseDir, d, archivePrefix)) count++;
        }
        if (count) console._originalLog?.(`Archived ${count} days of old log files in ${baseDir}`);
        return count;
    } catch (err) {
        try {
            console._originalError?.('Failed To Archive All Old Logs', err);
        } catch {
            console.error('Failed To Archive All Old Logs', err);
        }
        return 0;
    }
}

async function cleanupOldLogs(baseDir, maxAgeDays) {
    try {
        await ensureDir(baseDir);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - maxAgeDays);
        const allLogs = await collectLogFiles(baseDir);
        for (const f of allLogs) {
            const m = f.name.match(/\d{4}-\d{2}-\d{2}/);
            if (!m) continue;
            const fDate = new Date(m[0] + 'T00:00:00+02:00');
            if (fDate < cutoff)
                try {
                    await fs.unlink(f.path);
                } catch {}
        }
        const archiveDir = pathlra.join(baseDir, 'archive');
        try {
            const archFiles = await fs.readdir(archiveDir);
            for (const f of archFiles) {
                if (!f.endsWith('.zip')) continue;
                const m = f.match(/\d{4}-\d{2}-\d{2}/);
                if (!m) continue;
                const fDate = new Date(m[0] + 'T00:00:00+02:00');
                if (fDate < cutoff)
                    try {
                        await fs.unlink(pathlra.join(archiveDir, f));
                    } catch {}
            }
        } catch {}
    } catch (err) {
        try {
            console._originalError?.('Failed To Cleanup Old Logs', err);
        } catch {
            console.error('Failed To Cleanup Old Logs', err);
        }
    }
}

async function checkAndArchiveOnStartup(baseDir, archivePrefix) {
    try {
        await ensureDir(baseDir);
        await archiveAllOldLogs(baseDir, archivePrefix);
        await cleanupOldLogs(baseDir, 60);
        scheduleNextArchive(baseDir, archivePrefix);
    } catch (err) {
        try {
            console._originalError?.('Failed To Check And Archive On Startup', err);
        } catch {
            console.error('Failed To Check And Archive On Startup', err);
        }
    }
}

let archiveScheduled = false;

function getDelayToNextCairoMidnight() {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Cairo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const getPart = (type) => parseInt(parts.find((p) => p.type === type).value, 10);
    const y = getPart('year'),
        m = getPart('month'),
        d = getPart('day');
    const h = getPart('hour'),
        min = getPart('minute'),
        s = getPart('second');

    const cairoNow = new Date(Date.UTC(y, m - 1, d, h, min, s));
    const nextMidnight = new Date(Date.UTC(y, m - 1, d + 1, 0, 5, 0));
    return Math.max(1000, nextMidnight.getTime() - cairoNow.getTime());
}

function scheduleNextArchive(baseDir, archivePrefix) {
    if (archiveScheduled) return;
    archiveScheduled = true;
    const delay = getDelayToNextCairoMidnight();
    setTimeout(async () => {
        try {
            await archiveAllOldLogs(baseDir, archivePrefix);
            await cleanupOldLogs(baseDir, 60);
        } catch (err) {
            try {
                console._originalError?.('Scheduled Archive Failed', err);
            } catch {
                console.error('Scheduled Archive Failed', err);
            }
        } finally {
            archiveScheduled = false;
            scheduleNextArchive(baseDir, archivePrefix);
        }
    }, delay);
}

async function writeToFile(file, level, msg, meta, ts) {
    return enqueueWrite(async () => {
        try {
            await ensureDir(pathlra.dirname(file));
            let metaStr = '';
            if (Object.keys(meta).length) {
                try {
                    metaStr =
                        ' ' +
                        JSON.stringify(meta, (k, v) =>
                            typeof v === 'bigint' ? v.toString() : v instanceof Error ? { message: v.message, stack: v.stack } : v,
                        );
                } catch {
                    metaStr = ' Meta Serialization Failed';
                }
            }
            await fs.appendFile(file, `${ts} ${level.toUpperCase()} ${msg}${metaStr}\n`, 'utf8');
        } catch {
            try {
                console._originalError?.('Failed To Write Log');
            } catch {
                console.error('Failed To Write Log');
            }
        }
    });
}

module.exports.enqueueWrite = enqueueWrite;
module.exports.processQueue = processQueue;
module.exports.ensureDir = ensureDir;
module.exports.getCairoDate = getCairoDate;
module.exports.collectLogFiles = collectLogFiles;
module.exports.archiveLogFilesForDate = archiveLogFilesForDate;
module.exports.archiveAllOldLogs = archiveAllOldLogs;
module.exports.cleanupOldLogs = cleanupOldLogs;
module.exports.checkAndArchiveOnStartup = checkAndArchiveOnStartup;
module.exports.getDelayToNextCairoMidnight = getDelayToNextCairoMidnight;
module.exports.scheduleNextArchive = scheduleNextArchive;
module.exports.writeToFile = writeToFile;
