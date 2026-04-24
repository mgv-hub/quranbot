require('../package/Envira/src/lib/main').config();
require('pathlra-aliaser')();
const fs = require('fs').promises;
const fsSync = require('fs');
const pathlra = require('path');
const { LOGGING_CONFIG } = require('@configConstants-core_utils');
const LOG_DIR = pathlra.join(__dirname, LOGGING_CONFIG.DIR);
const ARCHIVE_DIR = pathlra.join(LOG_DIR, 'archive');
const MAX_LOG_AGE_DAYS = 60;
let writeQueue = [];
let isWriting = false;
let archiveScheduled = false;
let initializationComplete = false;

async function enqueueWrite(fn) {
   return new Promise((resolve, reject) => {
      writeQueue.push({ fn, resolve, reject });
      processQueue();
   });
}

async function processQueue() {
   if (isWriting || writeQueue.length === 0) return;
   isWriting = true;
   const item = writeQueue.shift();
   try {
      const result = await item.fn();
      item.resolve(result);
   } catch (error) {
      try {
         console._originalError?.('Logger Internal Error');
      } catch {
         console.error('Logger Internal Error');
      }
      item.reject(error);
   } finally {
      isWriting = false;
      if (writeQueue.length > 0) processQueue();
   }
}

async function ensureLogDir() {
   try {
      await fs.mkdir(LOG_DIR, { recursive: true });
      await fs.mkdir(ARCHIVE_DIR, { recursive: true });
   } catch {}
}

function getLogFilePath(level) {
   const now = new Date();
   const dateStr = now
      .toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' })
      .replace(/\//g, '-');

   const suffix =
      level === 'error' || level === 'fatal'
         ? 'errors'
         : level === 'warn'
           ? 'warnings'
           : 'general';

   return pathlra.join(LOG_DIR, `logs-${suffix}-${dateStr}.log`);
}

function getCairoDate() {
   return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
}

function parseDateFromFileName(filename) {
   const match = filename.match(/logs-(?:errors|warnings|general)-(\d{4}-\d{2}-\d{2})\.log/);
   if (!match) return null;
   return match[1];
}

async function archiveLogFilesForDate(dateStr) {
   try {
      await ensureLogDir();
      const normalizedDateStr = dateStr.replace(/\//g, '-');

      const logTypes = ['errors', 'warnings', 'general'];
      const filesToArchive = [];

      for (const type of logTypes) {
         const logFile = pathlra.join(LOG_DIR, `logs-${type}-${normalizedDateStr}.log`);
         try {
            const stats = await fs.stat(logFile);
            if (stats.size > 0) {
               filesToArchive.push({ path: logFile, type });
            }
         } catch {}
      }

      if (filesToArchive.length === 0) {
         return false;
      }

      const archiveFileName = `logs-archive-${normalizedDateStr}.zip`;
      const archivePath = pathlra.join(ARCHIVE_DIR, archiveFileName);

      const archiver = require('archiver');
      const output = fsSync.createWriteStream(archivePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(output);

      for (const file of filesToArchive) {
         archive.file(file.path, { name: pathlra.basename(file.path) });
      }

      await archive.finalize();

      await new Promise((resolve, reject) => {
         output.on('close', resolve);
         output.on('error', reject);
      });

      for (const file of filesToArchive) {
         try {
            await fs.unlink(file.path);
         } catch {}
      }

      return true;
   } catch (error) {
      try {
         console._originalError?.('Failed To Archive Log Files For Date ' + dateStr, error);
      } catch {
         console.error('Failed To Archive Log Files For Date ' + dateStr, error);
      }
      return false;
   }
}

async function archiveAllOldLogs() {
   try {
      await ensureLogDir();
      const todayDate = getCairoDate();
      const todayDateStr = todayDate.replace(/\//g, '-');

      const files = await fs.readdir(LOG_DIR);
      const logFiles = files.filter((f) => f.endsWith('.log') && !f.includes('archive'));

      const datesToArchive = new Set();

      for (const file of logFiles) {
         const fileDate = parseDateFromFileName(file);
         if (fileDate && fileDate !== todayDateStr) {
            datesToArchive.add(fileDate);
         }
      }

      let archivedCount = 0;
      for (const dateStr of datesToArchive) {
         const success = await archiveLogFilesForDate(dateStr);
         if (success) {
            archivedCount++;
         }
      }

      if (archivedCount > 0) {
         console._originalLog?.(`Archived ${archivedCount} days of old log files`);
      }

      return archivedCount;
   } catch (error) {
      try {
         console._originalError?.('Failed To Archive All Old Logs', error);
      } catch {
         console.error('Failed To Archive All Old Logs', error);
      }
      return 0;
   }
}

async function cleanupOldLogs() {
   try {
      await ensureLogDir();
      const now = new Date();
      const cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - MAX_LOG_AGE_DAYS);

      const files = await fs.readdir(LOG_DIR);

      for (const file of files) {
         if (!file.endsWith('.log')) continue;

         const fileDateStr = parseDateFromFileName(file);
         if (!fileDateStr) continue;

         const fileDate = new Date(fileDateStr + 'T00:00:00+02:00');

         if (fileDate < cutoffDate) {
            const filePath = pathlra.join(LOG_DIR, file);
            try {
               await fs.unlink(filePath);
            } catch {}
         }
      }

      const archiveFiles = await fs.readdir(ARCHIVE_DIR);

      for (const file of archiveFiles) {
         if (!file.startsWith('logs-archive-') || !file.endsWith('.zip')) continue;

         const match = file.match(/logs-archive-(\d{4}-\d{2}-\d{2})\.zip/);
         if (!match) continue;

         const fileDateStr = match[1];
         const fileDate = new Date(fileDateStr + 'T00:00:00+02:00');

         if (fileDate < cutoffDate) {
            const filePath = pathlra.join(ARCHIVE_DIR, file);
            try {
               await fs.unlink(filePath);
            } catch {}
         }
      }
   } catch (error) {
      try {
         console._originalError?.('Failed To Cleanup Old Logs', error);
      } catch {
         console.error('Failed To Cleanup Old Logs', error);
      }
   }
}

async function checkAndArchiveOnStartup() {
   if (initializationComplete) return;
   try {
      await ensureLogDir();

      const archivedCount = await archiveAllOldLogs();

      await cleanupOldLogs();

      initializationComplete = true;

      scheduleNextArchive();
   } catch (error) {
      try {
         console._originalError?.('Failed To Check And Archive On Startup', error);
      } catch {
         console.error('Failed To Check And Archive On Startup', error);
      }
   }
}

function scheduleNextArchive() {
   if (archiveScheduled) return;
   archiveScheduled = true;

   const now = new Date();
   const tomorrow = new Date(now);
   tomorrow.setDate(tomorrow.getDate() + 1);
   tomorrow.setHours(0, 5, 0, 0);

   const msUntilMidnight = tomorrow.getTime() - now.getTime();

   setTimeout(async () => {
      await archiveLogFilesForDate(getCairoDate());
      await cleanupOldLogs();
      archiveScheduled = false;
      scheduleNextArchive();
   }, msUntilMidnight);
}

async function writeToFile(level, message, meta = {}, timestamp) {
   return enqueueWrite(async () => {
      try {
         await ensureLogDir();
         const logFile = getLogFilePath(level);

         let metaStr = '';
         if (Object.keys(meta).length > 0) {
            try {
               metaStr =
                  ' ' +
                  JSON.stringify(meta, (key, value) =>
                     typeof value === 'bigint'
                        ? value.toString()
                        : value instanceof Error
                          ? { message: value.message, stack: value.stack }
                          : value,
                  );
            } catch {
               metaStr = ' Meta Serialization Failed';
            }
         }

         const logEntry = `${timestamp} ${level.toUpperCase()} ${message}${metaStr}\n`;
         await fs.appendFile(logFile, logEntry, 'utf8');
      } catch (error) {
         try {
            console._originalError?.('Failed To Write Log');
         } catch {
            console.error('Failed To Write Log');
         }
      }
   });
}

async function writeLog(level, message, meta = {}) {
   const timestamp = new Date().toISOString();

   await writeToFile(level, message, meta, timestamp);

   try {
      const colorMap = {
         error: '\x1b[31m',
         fatal: '\x1b[35m',
         warn: '\x1b[33m',
         info: '\x1b[36m',
         debug: '\x1b[32m',
      };

      const color = colorMap[level] || '\x1b[37m';
      const reset = '\x1b[0m';
      const consoleMethod =
         level === 'error' || level === 'fatal'
            ? console._originalError || console.error
            : level === 'warn'
              ? console._originalWarn || console.warn
              : console._originalLog || console.log;

      consoleMethod(`${color}${timestamp} ${level.toUpperCase()} ${message}${reset}`);

      if (Object.keys(meta).length > 0) {
         consoleMethod(color, meta, reset);
      }
   } catch {}
}

class Logger {
   info(message, meta = {}) {
      return writeLog('info', message, meta);
   }

   warn(message, meta = {}) {
      return writeLog('warn', message, meta);
   }

   error(message, errorObj = null, meta = {}) {
      const fullMeta = { ...meta };
      let fullMessage = message;

      if (errorObj instanceof Error) {
         fullMessage = `${message} ${errorObj.message}`;
         fullMeta.stack = errorObj.stack?.split('\n').slice(0, 8).join('\n');
         fullMeta.name = errorObj.name;
      } else if (errorObj) {
         fullMeta.reason = String(errorObj);
      }

      return writeLog('error', fullMessage, fullMeta);
   }

   fatal(message, errorObj = null, meta = {}) {
      return this.error(`FATAL ${message}`, errorObj, {
         ...meta,
         isFatal: true,
      });
   }

   debug(message, meta = {}) {
      return writeLog('debug', message, meta);
   }
}

const logger = new Logger();

(async function initializeLogger() {
   await ensureLogDir();
   await checkAndArchiveOnStartup();
})();
(function patchConsole() {
   if (!console._originalLog) console._originalLog = console.log;
   if (!console._originalError) console._originalError = console.error;
   if (!console._originalWarn) console._originalWarn = console.warn;
   if (!console._originalDebug) console._originalDebug = console.debug;

   if (console._isPatched) return;
   console._isPatched = true;

   console.log = (...args) => {
      try {
         const msg = args
            .map((arg) =>
               typeof arg === 'object' && arg !== null
                  ? arg instanceof Error
                     ? arg.message
                     : JSON.stringify(arg, null, 2)
                  : String(arg),
            )
            .join(' ');
         logger.info(msg);
      } catch {}
      console._originalLog(...args);
   };

   console.warn = (...args) => {
      try {
         const msg = args
            .map((arg) =>
               typeof arg === 'object' && arg !== null
                  ? arg instanceof Error
                     ? arg.message
                     : JSON.stringify(arg, null, 2)
                  : String(arg),
            )
            .join(' ');
         logger.warn(msg);
      } catch {}
      console._originalWarn(...args);
   };

   console.error = (...args) => {
      try {
         const err = args.find((arg) => arg instanceof Error);
         const msg = args
            .filter((arg) => !(arg instanceof Error))
            .map((arg) =>
               typeof arg === 'object' && arg !== null
                  ? JSON.stringify(arg, null, 2)
                  : String(arg),
            )
            .join(' ');
         logger.error(msg, err || null);
      } catch {}
      console._originalError(...args);
   };

   console.debug = (...args) => {
      try {
         const msg = args
            .map((arg) =>
               typeof arg === 'object' && arg !== null
                  ? JSON.stringify(arg, null, 2)
                  : String(arg),
            )
            .join(' ');
         logger.debug(msg);
      } catch {}
      console._originalDebug(...args);
   };
})();

module.exports = logger;
