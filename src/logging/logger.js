const pathlra = require('path');
const { logging_config } = require('@config/constants');
const {
    enqueueWrite,
    ensureDir,
    getCairoDate,
    archiveAllOldLogs,
    cleanupOldLogs,
    getDelayToNextCairoMidnight,
    scheduleNextArchive,
    writeToFile,
} = require('./logging-engine');
const LOG_DIR = pathlra.join(__dirname, logging_config.dir);
let initDone = false;

function getLogFilePath(level) {
    const date = getCairoDate().replace(/\//g, '-');
    const suffix =
        level === 'error' || level === 'fatal'
            ? 'errors'
            : level === 'warn'
              ? 'warnings'
              : level === 'user'
                ? 'users'
                : level === 'db'
                  ? 'database'
                  : level === 'loader'
                    ? 'loader'
                    : level === 'lavalink'
                      ? 'lavalink'
                      : 'general';
    return pathlra.join(LOG_DIR, `logs-${suffix}-${date}.log`);
}

async function checkAndArchive() {
    if (initDone) return;
    try {
        await ensureDir(LOG_DIR);
        await archiveAllOldLogs(LOG_DIR, 'logs');
        await cleanupOldLogs(LOG_DIR, 60);
        initDone = true;
        scheduleNextArchive(LOG_DIR, 'logs');
    } catch (err) {
        try {
            console._originalError?.('Failed To Check And Archive On Startup', err);
        } catch {
            console.error('Failed To Check And Archive On Startup', err);
        }
    }
}

// write log + echo to console with colors
async function writeLog(level, msg, meta = {}) {
    const ts = new Date().toISOString();
    await writeToFile(getLogFilePath(level), level, msg, meta, ts);
    try {
        const colors = {
            error: '\x1b[31m',
            fatal: '\x1b[35m',
            warn: '\x1b[33m',
            info: '\x1b[36m',
            debug: '\x1b[32m',
            user: '\x1b[34m',
            db: '\x1B[34;1m',
            loader: '\x1B[36;1m',
            lavalink: '\x1B[35;1m',
        };
        const c = colors[level] || '\x1b[37m',
            reset = '\x1b[0m';
        const method =
            level === 'error' || level === 'fatal'
                ? console._originalError || console.error
                : level === 'warn'
                  ? console._originalWarn || console.warn
                  : console._originalLog || console.log;
        method(`${c}${ts} ${level.toUpperCase()} ${msg}${reset}`);
        if (Object.keys(meta).length) method(c, meta, reset);
    } catch {}
}

class Logger {
    info(m, meta = {}) {
        return writeLog('info', m, meta);
    }
    warn(m, meta = {}) {
        return writeLog('warn', m, meta);
    }
    error(m, errObj = null, meta = {}) {
        const fullMeta = { ...meta };
        let fullMsg = m;
        if (errObj instanceof Error) {
            fullMsg = `${m} ${errObj.message}`;
            fullMeta.stack = errObj.stack?.split('\n').slice(0, 8).join('\n');
            fullMeta.name = errObj.name;
        } else if (errObj) fullMeta.reason = String(errObj);
        return writeLog('error', fullMsg, fullMeta);
    }
    fatal(m, errObj = null, meta = {}) {
        return this.error(`FATAL ${m}`, errObj, { ...meta, isFatal: true });
    }
    debug(m, meta = {}) {
        return writeLog('debug', m, meta);
    }
    user(m, meta = {}) {
        return writeLog('user', m, meta);
    }
    db(m, meta = {}) {
        return writeLog('db', m, meta);
    }
    loader(m, meta = {}) {
        return writeLog('loader', m, meta);
    }
    lavalink(m, meta = {}) {
        return writeLog('lavalink', m, meta);
    }
}

const logger = new Logger();
(async () => {
    await ensureDir(LOG_DIR);
    await checkAndArchive();
})();
// patch console methods to route through logger
(function patchConsole() {
    if (console._isPatched) return;
    console._isPatched = true;
    if (!console._originalLog) console._originalLog = console.log;
    if (!console._originalError) console._originalError = console.error;
    if (!console._originalWarn) console._originalWarn = console.warn;
    if (!console._originalDebug) console._originalDebug = console.debug;

    const stringify = (args) =>
        args
            .map((a) => (typeof a === 'object' && a !== null ? (a instanceof Error ? a.message : JSON.stringify(a, null, 2)) : String(a)))
            .join(' ');

    console.log = (...args) => {
        try {
            logger.info(stringify(args));
        } catch {}
        console._originalLog(...args);
    };
    console.warn = (...args) => {
        try {
            logger.warn(stringify(args));
        } catch {}
        console._originalWarn(...args);
    };
    console.error = (...args) => {
        try {
            const err = args.find((a) => a instanceof Error);
            const msg = args
                .filter((a) => !(a instanceof Error))
                .map((a) => (typeof a === 'object' && a !== null ? JSON.stringify(a, null, 2) : String(a)))
                .join(' ');
            logger.error(msg, err || null);
        } catch {}
        console._originalError(...args);
    };
    console.debug = (...args) => {
        try {
            logger.debug(stringify(args));
        } catch {}
        console._originalDebug(...args);
    };
})();

module.exports = logger;
