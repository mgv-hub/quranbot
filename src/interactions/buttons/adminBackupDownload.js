const fsPromises = require('fs').promises;
const pathlra = require('path');
const logger = require('@logging/logger');

const BACKUP_DIR = pathlra.resolve(__dirname, '../../../storage/backups');

module.exports = {
    async execute(interaction) {
        const filename = interaction.customId.replace('download_backup_', '');
        const backupPath = pathlra.join(BACKUP_DIR, filename);

        if (!global.SPE_USER_IDS || !global.SPE_USER_IDS.includes(interaction.user.id)) {
            return interaction.reply({
                content: 'This feature is available for the developers only',
                flags: 64,
            });
        }

        try {
            await interaction.deferReply({ flags: 64 });
            const buffer = await fsPromises.readFile(backupPath);
            await interaction.editReply({
                content: `**Backup File**\n\`${filename}\``,
                files: [{ attachment: buffer, name: filename }],
            });
        } catch (err) {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: 'Failed to retrieve the backup file.' });
            } else {
                await interaction.reply({ content: 'Failed to retrieve the backup file.', flags: 64 });
            }
        }
    },
};
