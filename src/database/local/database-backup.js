const fs = require('fs');
const fsPromises = require('fs').promises;
const pathlra = require('path');
const { get, ref } = require('firebase/database');
const zlib = require('zlib');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const logger = require('@logging/logger');
const { db, isFirebaseReady } = require('../firebase/index');
const { paths } = require('@config/constants');

const BACKUP_INTERVAL_MS = parseInt(process.env.BACKUP_INTERVAL_MS);
const BACKUP_DIR = pathlra.resolve(__dirname, '../../../storage/backups');

const BACKUP_CHANNEL_ID = process.env.CHANNEL_ID;
const BACKUP_SERVER_ID = process.env.SERVER_ID;

function generateBackupFilename() {
    const now = new Date();
    const ts = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0'),
        String(now.getMilliseconds()).padStart(3, '0'),
    ].join('-');
    return `backup_${ts}.json.gz`;
}

async function ensureBackupDirectory() {
    try {
        await fsPromises.mkdir(BACKUP_DIR, { recursive: true });
    } catch (err) {
        logger.error('Failed To Create Backup Directory', err);
    }
}

function compressFile(input, output) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(input)
            .pipe(zlib.createGzip())
            .pipe(fs.createWriteStream(output))
            .on('finish', () => {
                fs.unlink(input, () => {});
                resolve();
            })
            .on('error', reject);
    });
}

async function sendBackupToDiscord(backupFilename, origSize, compSize, ratio) {
    try {
        const client = global.client;
        if (!client) {
            logger.warn('Client Not Available Skipping Discord Backup Send');
            return;
        }

        if (!BACKUP_CHANNEL_ID || !BACKUP_SERVER_ID) {
            logger.warn('Backup Channel Or Server ID Not Configured');
            return;
        }

        const channel = client.channels.cache.get(BACKUP_CHANNEL_ID) || (await client.channels.fetch(BACKUP_CHANNEL_ID).catch(() => null));
        if (!channel) {
            logger.warn('Backup Channel Not Found ' + BACKUP_CHANNEL_ID);
            return;
        }

        const guild = channel.guild;
        if (!guild || guild.id !== BACKUP_SERVER_ID) {
            logger.warn('Backup Channel Not In Expected Server Expected ' + BACKUP_SERVER_ID + ' Got ' + (guild?.id || 'none'));
            return;
        }

        const formatBytes = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const KB = 1024;
            const sizes = ['Bytes', 'KB', 'MB'];
            const h = Math.floor(Math.log(bytes) / Math.log(KB));
            return parseFloat((bytes / Math.pow(KB, h)).toFixed(2)) + ' ' + sizes[h];
        };

        const embed = new EmbedBuilder()
            .setColor(0xfefdfe)
            .setTitle('Backup Created')
            .addFields(
                { name: 'Filename', value: `\`${backupFilename}\``, inline: false },
                { name: 'Original Size', value: formatBytes(origSize), inline: true },
                { name: 'Compressed Size', value: formatBytes(compSize), inline: true },
                { name: 'Compression Ratio', value: `${ratio}%`, inline: true },
                { name: 'Time', value: new Date().toISOString(), inline: false },
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`download_backup_${backupFilename}`)
                .setLabel('Download Backup')
                .setStyle(ButtonStyle.Secondary),
        );

        await channel.send({
            embeds: [embed],
            components: [row],
        });
        // logger.info('Backup Sent To Discord Channel ' + BACKUP_CHANNEL_ID + ' In Server ' + BACKUP_SERVER_ID);
    } catch (err) {}
}

async function performBackup() {
    if (!isFirebaseReady || !db) {
        logger.warn('Firebase Not Ready Skipping Backup');
        return;
    }
    try {
        const snap = await get(ref(db, '/'));
        if (!snap.exists()) {
            logger.warn('Database Is Empty Skipping Backup');
            return;
        }
        const data = snap.val();
        const filename = generateBackupFilename();
        const backupPath = pathlra.join(BACKUP_DIR, filename);
        const tmpPath = backupPath.replace('.gz', '.tmp.json');
        await ensureBackupDirectory();
        await fsPromises.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
        const origSize = (await fsPromises.stat(tmpPath)).size;
        await compressFile(tmpPath, backupPath);
        const compSize = (await fsPromises.stat(backupPath)).size;
        const ratio = ((1 - compSize / origSize) * 100).toFixed(2);

        //   logger.info(
        //       'Local Backup Created Successfully At ' +
        //           backupPath +
        //           ' Original ' +
        //           origSize +
        //           ' bytes Compressed ' +
        //           compSize +
        //           ' bytes Reduced ' +
        //           ratio +
        //           '%',
        //   );
        await sendBackupToDiscord(filename, origSize, compSize, ratio);
    } catch (err) {
        logger.error('Failed To Create Local Backup', err);
    }
}

function startBackupService() {
    setTimeout(() => {
        setInterval(performBackup, BACKUP_INTERVAL_MS);
    }, 5000);
}

startBackupService();
