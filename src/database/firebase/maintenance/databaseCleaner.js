const logger = require('@logging/logger');
const { isFirebaseReady, db } = require('../index');
const retentiondb = require('@database/firebase/retention/retention');

class DatabaseCleaner {
    constructor() {
        this.client = null;
        this.isInitialized = false;
    }

    // attach client + set ready flag
    initialize(client) {
        this.client = client;
        this.isInitialized = true;
        logger.db('Database Cleaner Initialized');
    }

    // exec cleanup routines + return summary
    async performCleanup() {
        if (!this.isInitialized) {
            logger.warn('Database Cleaner Not Initialized');
            return { success: false, reason: 'Not initialized' };
        }
        if (!isFirebaseReady || !db) {
            logger.warn('Firebase Not Available Skipping Cleanup');
            return { success: false, reason: 'Firebase not ready' };
        }
        logger.db('Starting Database Cleanup Process');

        const results = await retentiondb.performMaintenance(this.client);

        logger.db('Database Cleanup Complete', results);
        return { success: true, results };
    }
}
const databaseCleaner = new DatabaseCleaner();
module.exports = databaseCleaner;
