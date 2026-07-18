const logger = require('@logging/logger');
const { loadData } = require('@data/data-manager');
const client = require('@startup/botSetup').client;
const persistentStateManager = require('@state/PersistentStateManager');
const { loadSetupGuildsFromFirebase, loadGuildStatesFromFirebase } = require('@database/firebase');
const { validateAndFixSetupData } = require('@ready/setupValidator');
const { recoverAzkarTimers } = require('@ready/azkarRecovery');
// const { recoverVoiceConnection } = require('@ready/voiceRecovery');
const { restoreGuildStates } = require('@ready/stateRestoration');
const { registerAllCommands, startMemoryCleanup } = require('@ready/commandRegistration');
const { initializeStats, startStatsTracker } = require('@statistics/StatisticsTracker');
const { setupNotificationRoles } = require('@events/notificationRoles');
const databaseCleaner = require('../database/firebase/maintenance/databaseCleaner');
const retentiondb = require('@database/firebase/retention/retention');
require('@database/local/database-backup');
const { attachManagerEvents } = require('@audio');

attachManagerEvents(client.lavalink);

loadData()
    .then(async () => {
        await persistentStateManager.initialize();
        await initializeStats();
        databaseCleaner.initialize(client);
        client.once('clientReady', async () => {
            try {
                await client.lavalink.init(client.user);
                logger.info('Lavalink Manager initialized successfully');
            } catch (err) {
                logger.error('Failed to initialize Lavalink Manager', err);
            }
            await setupNotificationRoles(client);

            const runtimeStates = require('@runtime/runtime_states');
            await runtimeStates.restoreRuntimeStates(client);
            logger.info('Logged In As ' + client.user.tag + ' - ' + (global.surahNames?.length || 114) + ' Surahs Loaded');
            logger.info('Number Of Reciters ' + Object.keys(global.reciters).length);
            logger.info('Total Surahs Loaded ' + global.surahNames.length);
            logger.info('Total Adhkar Categories ' + (global.azkarData?.length || 0));
            startStatsTracker();
            await databaseCleaner.performCleanup();
            await retentiondb.cleanExpiredLeftData(client);
            retentiondb.startRetentionScheduler(client);

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
                    // await recoverVoiceConnection(guild, fixedSetupData, guildId);
                }, i * 1000);
            }
            const staleGuildIds = allSetupGuildIds.filter((gid) => !actualBotGuilds.has(gid));
            if (staleGuildIds.length > 0) {
            }
            await restoreGuildStates(client, actualBotGuilds);
            await registerAllCommands(client);
            startMemoryCleanup();
            logger.info('Serving ' + client.guilds.cache.size + ' Guilds');
        });
        try {
            await client.login(global.token);
            logger.info('Discord Client Login');
        } catch (loginError) {
            logger.fatal('Failed To Log In To Discord', loginError);
            process.exit(1);
        }
    })
    .catch((loadError) => {
        logger.fatal('Critical Failure During Data Loading Cannot Start Bot', loadError);
    });
