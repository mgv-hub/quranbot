require('pathlra-aliaser')();
const fs = require('fs');
const fsPromises = require('fs').promises;
const pathlra = require('path');
const { get, ref } = require('firebase/database');
const logger = require('@logger');
const { db, isFirebaseReady } = require('@firebase-core_utils');
const { PATHS } = require('@configConstants-core_utils');
const zlib = require('zlib');

const BACKUP_INTERVAL_MS = parseInt(process.env.BACKUP_INTERVAL_MS);
const BACKUP_DIR = pathlra.join(__dirname, '..', '..', PATHS.STORAGE_BASE, 'backups');

function getCurrentEnv() {
   const baseEnvPath = pathlra.resolve(__dirname, '../../.env');
   if (fs.existsSync(baseEnvPath)) {
      const content = fs.readFileSync(baseEnvPath, 'utf8');
      const match = content.match(/NODE_ENV\s*=\s*(\w+)/);
      if (match) {
         return match[1].trim();
      }
   }
   return 'development';
}

function getBackupChannelId() {
   const env = getCurrentEnv();
   if (env === 'production') {
      return process.env.PRODUCTION_CHANNEL_ID;
   }
   return process.env.DEVELOPMENT_CHANNEL_ID;
}

function getBackupServerId() {
   const env = getCurrentEnv();
   if (env === 'production') {
      return process.env.PRODUCTION_SERVER_ID;
   }
   return process.env.DEVELOPMENT_SERVER_ID;
}

function generateBackupFilename() {
   const now = new Date();
   const year = now.getFullYear();
   const month = String(now.getMonth() + 1).padStart(2, '0');
   const day = String(now.getDate()).padStart(2, '0');
   const hours = String(now.getHours()).padStart(2, '0');
   const minutes = String(now.getMinutes()).padStart(2, '0');
   const seconds = String(now.getSeconds()).padStart(2, '0');
   const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
   return `backup_${year}-${month}-${day}_${hours}-${minutes}-${seconds}-${milliseconds}.json.gz`;
}

async function ensureBackupDirectory() {
   try {
      await fsPromises.mkdir(BACKUP_DIR, { recursive: true });
   } catch (error) {
      logger.error('Failed To Create Backup Directory', error);
   }
}

function compressFile(inputPath, outputPath) {
   return new Promise((resolve, reject) => {
      const inputStream = fs.createReadStream(inputPath);
      const outputStream = fs.createWriteStream(outputPath);
      const gzip = zlib.createGzip();
      inputStream
         .pipe(gzip)
         .pipe(outputStream)
         .on('finish', () => {
            fs.unlink(inputPath, () => {});
            resolve();
         })
         .on('error', reject);
   });
}

async function sendBackupToDiscord(backupPath, backupFilename) {
   try {
      const client = global.client;
      if (!client) {
         logger.warn('Client Not Available Skipping Discord Backup Send');
         return;
      }
      const channelId = getBackupChannelId();
      const serverId = getBackupServerId();
      const env = getCurrentEnv();
      const channel =
         client.channels.cache.get(channelId) || (await client.channels.fetch(channelId).catch(() => null));
      if (!channel) {
         logger.warn('Backup Channel Not Found ' + channelId);
         return;
      }
      const guild = channel.guild;
      if (!guild || guild.id !== serverId) {
         logger.warn('Backup Channel Not In Expected Server Expected ' + serverId + ' Got ' + (guild?.id || 'none'));
         return;
      }
      const fileBuffer = await fsPromises.readFile(backupPath);
      const attachment = {
         attachment: fileBuffer,
         name: backupFilename,
      };
      await channel.send({
         content:
            '**Backup Created**\nEnvironment: ' + env + '\nServer: ' + serverId + '\nTime: ' + new Date().toISOString(),
         files: [attachment],
      });
      logger.info('Backup Sent To Discord Channel ' + channelId + ' In Server ' + serverId);
   } catch (error) {
      logger.error('Failed To Send Backup To Discord', error);
   }
}

async function performBackup() {
   if (!isFirebaseReady || !db) {
      logger.warn('Firebase Not Ready Skipping Backup');
      return;
   }
   try {
      const snapshot = await get(ref(db, '/'));
      if (!snapshot.exists()) {
         logger.warn('Database Is Empty Skipping Backup');
         return;
      }
      const data = snapshot.val();
      const backupFilename = generateBackupFilename();
      const backupPath = pathlra.join(BACKUP_DIR, backupFilename);
      const tempJsonPath = backupPath.replace('.gz', '.tmp.json');
      await ensureBackupDirectory();
      await fsPromises.writeFile(tempJsonPath, JSON.stringify(data, null, 2), 'utf8');
      const originalSize = (await fsPromises.stat(tempJsonPath)).size;
      await compressFile(tempJsonPath, backupPath);
      const compressedSize = (await fsPromises.stat(backupPath)).size;
      const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);
      logger.info(
         'Local Backup Created Successfully At ' +
            backupPath +
            ' Original ' +
            originalSize +
            ' bytes Compressed ' +
            compressedSize +
            ' bytes Reduced ' +
            compressionRatio +
            '%',
      );
      await sendBackupToDiscord(backupPath, backupFilename);
   } catch (error) {
      logger.error('Failed To Create Local Backup', error);
   }
}

function startBackupService() {
   const env = getCurrentEnv();
   const serverId = getBackupServerId();
   const channelId = getBackupChannelId();
   logger.info('Local Backup Service Starting With Interval ' + BACKUP_INTERVAL_MS + 'ms');
   logger.info('Environment: ' + env + ' Server: ' + serverId + ' Channel: ' + channelId);
   setTimeout(() => {
      setInterval(() => {
         performBackup();
      }, BACKUP_INTERVAL_MS);
   }, 5000);
}

startBackupService();
