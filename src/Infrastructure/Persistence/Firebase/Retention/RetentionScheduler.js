const logger = require('@infrastructure/Logging/Logger');
const { cleanupInterval } = require('@infrastructure/Persistence/Firebase/Retention/RetentionCore');
const { performMaintenance } = require('@infrastructure/Persistence/Firebase/Retention/RetentionCleaners');

let retentionInterval = null;

function startRetentionScheduler(client) {
    if (retentionInterval) {
        clearInterval(retentionInterval);
    }

    retentionInterval = setInterval(async () => {
        try {
            const result = await performMaintenance(client);
            logger.db(`Periodic retention cleanup completed: ${JSON.stringify(result)}`);
        } catch (error) {
            logger.error('Retention scheduler failed', error);
        }
    }, cleanupInterval);

    if (retentionInterval && typeof retentionInterval.unref === 'function') {
        retentionInterval.unref();
    }
}

function stopRetentionScheduler() {
    if (!retentionInterval) {
        return;
    }

    clearInterval(retentionInterval);

    retentionInterval = null;
}

module.exports.startRetentionScheduler = startRetentionScheduler;
module.exports.stopRetentionScheduler = stopRetentionScheduler;
