const logger = require('@infrastructure/Logging/Logger');
const { loadData } = require('@data/Management/DataManager');
const client = require('@bootstrap/BotSetup').client;
const persistentStateManager = require('@state/PersistentStateManager');
const { loadSetupGuildsFromFirebase, loadGuildStatesFromFirebase } = require('@infrastructure/Persistence/Firebase/FirebaseIndex');
const { validateAndFixSetupData } = require('@bootstrap/SetupValidator');
const { recoverAzkarTimers } = require('@bootstrap/AzkarRecovery');
// const { recoverVoiceConnection } = require('@ready/voiceRecovery');
const { restoreGuildStates } = require('@bootstrap/GuildStateRestoration/Index');
const { registerAllCommands, startMemoryCleanup } = require('@bootstrap/CommandRegistration');
const { initializeStats, startStatsTracker } = require('@statistics/StatisticsTracker');
const { setupNotificationRoles } = require('@infrastructure/Discord/Events/NotificationRoles');
const databaseCleaner = require('@infrastructure/Persistence/Firebase/Maintenance/DatabaseCleaner');
const retentiondb = require('@infrastructure/Persistence/Firebase/Retention/RetentionIndex');
require('@infrastructure/Persistence/Local/DatabaseBackup');
const { attachManagerEvents } = require('@modules/Audio/AudioModule');
const prayerReminderManager = require('@modules/Prayer/Reminders/Services/PrayerReminderManager');
const { startScheduler } = require('@modules/Prayer/Reminders/Services/PrayerReminderSchedulerModule');
const { loadPrayerTimesData } = require('@data/PrayerTimes/PrayerTimesData');
const statusManager = require('@state/StatusManager');

attachManagerEvents(client.lavalink);

loadData()
    .then(async () => {
        await persistentStateManager.initialize();
        await prayerReminderManager.initialize();
        await statusManager.initialize();
        await initializeStats();
        await loadPrayerTimesData();

        databaseCleaner.initialize(client);
        client.once('clientReady', async () => {
            try {
                await client.lavalink.init(client.user);
                logger.info('Lavalink Manager initialized successfully');
            } catch (err) {
                logger.error('Failed to initialize Lavalink Manager', err);
            }
            await setupNotificationRoles(client);
            await statusManager.applyPresence();

            const runtimeStates = require('@core/RuntimeStates');
            await runtimeStates.restoreRuntimeStates(client);
            logger.info('Logged In As ' + client.user.tag + ' - ' + (global.surahNames?.length || 114) + ' Surahs Loaded');
            logger.info('Number Of Reciters ' + Object.keys(global.reciters).length);
            logger.info('Total Surahs Loaded ' + global.surahNames.length);
            logger.info('Total Adhkar Categories ' + (global.azkarData?.length || 0));
            startStatsTracker();
            await databaseCleaner.performCleanup();
            await retentiondb.cleanExpiredLeftData(client);
            retentiondb.startRetentionScheduler(client);

            const setup_guilds = await loadSetupGuildsFromFirebase();
            global.setupGuilds = setup_guilds || {};

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
                }, i * 1700);
            }

            await restoreGuildStates(client, actualBotGuilds);
            await registerAllCommands(client);
            startMemoryCleanup();
            await startScheduler();
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
