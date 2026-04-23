require('pathlra-aliaser')();

const logger = require('@logger');
const { isFirebaseReady, db } = require('@firebase-core_utils');
const { cleanSetupGuilds } = require('@db-cleaner-setup-core_utils');
const { cleanGuildStates } = require('@db-cleaner-states-core_utils');
const { cleanControlIds } = require('@db-cleaner-control-core_utils');

class DatabaseCleaner {
   constructor() {
      this.client = null;
      this.isInitialized = false;
   }

   initialize(client) {
      this.client = client;
      this.isInitialized = true;
      logger.info('Database Cleaner Initialized');
   }

   async performCleanup() {
      if (!this.isInitialized) {
         logger.warn('Database Cleaner Not Initialized');
         return { success: false, reason: 'Not initialized' };
      }

      if (!isFirebaseReady || !db) {
         logger.warn('Firebase Not Available Skipping Cleanup');
         return { success: false, reason: 'Firebase not ready' };
      }

      logger.info('Starting Database Cleanup Process');

      const results = {
         setupGuilds: await cleanSetupGuilds(this.client),
         guildStates: await cleanGuildStates(this.client),
         controlIds: await cleanControlIds(this.client),
      };

      logger.info('Database Cleanup Complete', results);
      return { success: true, results };
   }
}

const databaseCleaner = new DatabaseCleaner();
module.exports = databaseCleaner;
