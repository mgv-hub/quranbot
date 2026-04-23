require('pathlra-aliaser');
const logger = require('@logger');
const { loadData } = require('@data-manager-core_data');
const client = require('@botSetup').client;
const persistentStateManager = require('@PersistentStateManager-core_state');
const backupManager = require('@BackupManager-core_state').backupManager;
const { loadSetupGuildsFromFirebase, loadGuildStatesFromFirebase } = require('@firebase-core_utils');
const { validateAndFixSetupData } = require('@setupValidator-core_ready');
const { recoverAzkarTimers } = require('@azkarRecovery-core_ready');
const { recoverVoiceConnection } = require('@voiceRecovery-core_ready');
const { restoreGuildStates } = require('@stateRestoration-core_ready');
const { registerAllCommands, startMemoryCleanup } = require('@commandRegistration-core_ready');
const { initializeStats, startStatsTracker } = require('@StatisticsTracker-core_statistics');
const databaseCleaner = require('@databaseCleaner-core_utils');
require('@localBackupManager-core_utils');
loadData()
   .then(async () => {
      await persistentStateManager.initialize();
      await backupManager.initialize();
      await initializeStats();

      databaseCleaner.initialize(client);

      client.once('clientReady', async () => {
         const runtimeStates = require('@RuntimeState-core_runtime');
         await runtimeStates.restoreRuntimeStates(client);

         logger.info('Logged In As ' + client.user.tag + ' - ' + (global.surahNames?.length || 114) + ' Surahs Loaded');
         logger.info('Number Of Reciters ' + Object.keys(global.reciters).length);
         logger.info('Total Surahs Loaded ' + global.surahNames.length);
         logger.info('Total Adhkar Categories ' + (global.azkarData?.length || 0));

         startStatsTracker();

         await databaseCleaner.performCleanup();

         const setupGuilds = await loadSetupGuildsFromFirebase();

         global.setupGuilds = setupGuilds || {};
         const guildStates = await loadGuildStatesFromFirebase();
         const allSetupGuildIds = Object.keys(global.setupGuilds || {});
         const actualBotGuilds = new Set(client.guilds.cache.keys());

         logger.info('Loaded ' + allSetupGuildIds.length + ' Setup Guilds From Firebase Primary Source For Recovery');
         logger.info('Bot Is Actually In ' + actualBotGuilds.size + ' Guilds Will Only Process These');

         const guildsToProcess = allSetupGuildIds.filter((gid) => actualBotGuilds.has(gid));
         logger.info('Will Process ' + guildsToProcess.length + ' Guilds That Bot Is Actually In');

         for (let i = 0; i < guildsToProcess.length; i++) {
            const guildId = guildsToProcess[i];
            const setupData = global.setupGuilds[guildId];
            setTimeout(async () => {
               const guild = client.guilds.cache.get(guildId);
               if (!guild) {
                  logger.info('Guild ' + guildId + ' Not In Bot Cache Skipping');
                  return;
               }
               if (!setupData || Object.keys(setupData).length === 0) {
                  logger.info('Guild ' + guildId + ' Has No Setup Data Skipping');
                  return;
               }
               const fixedSetupData = await validateAndFixSetupData(guild, setupData);
               await recoverAzkarTimers(guild, fixedSetupData, guildId);
               await recoverVoiceConnection(guild, fixedSetupData, guildId);
            }, i * 500);
         }

         const staleGuildIds = allSetupGuildIds.filter((gid) => !actualBotGuilds.has(gid));
         if (staleGuildIds.length > 0) {
            logger.info('Skipping ' + staleGuildIds.length + ' Setup Guilds Bot Not In These Shared Database Entries');
         }

         await restoreGuildStates(client, actualBotGuilds);
         await registerAllCommands(client);
         startMemoryCleanup();

         logger.info('Bot Is Fully READY');
         logger.info('Voice Connections Will Be Auto Restored From Setup Guilds After Restart');
         logger.info('Backup System Active Auto Recovery Enabled');
         logger.info('Serving ' + client.guilds.cache.size + ' Guilds');
      });

      try {
         await client.login(global.token);
         logger.info('Discord Client Login Initiated');
      } catch (loginError) {
         logger.fatal('Failed To Log In To Discord', loginError);
         process.exit(1);
      }
   })
   .catch((loadError) => {
      logger.fatal('Critical Failure During Data Loading Cannot Start Bot', loadError);
   });
