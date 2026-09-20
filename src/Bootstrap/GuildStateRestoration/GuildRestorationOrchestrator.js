const logger = require('@infrastructure/Logging/Logger');
const auditLogger = require('@infrastructure/Logging/AuditLogger');
const { identifyRestorableGuilds } = require('@bootstrap/GuildStateRestoration/RestorableGuildIdentifier');
const { establishVoiceConnection } = require('@bootstrap/GuildStateRestoration/VoiceChannelJoinStrategy');
const { resumeGuildPlayback } = require('@bootstrap/GuildStateRestoration/PlaybackStateResumption');
const { scheduleDelayedCapacityRetry } = require('@bootstrap/GuildStateRestoration/LavalinkCapacityRetryScheduler');

let restorationActive = false;

async function restoreGuildStates(client, activeGuildIds) {
    const guildsToRestore = identifyRestorableGuilds(activeGuildIds);
    if (restorationActive || guildsToRestore.length === 0) return;

    restorationActive = true;
    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;

    for (let index = 0; index < guildsToRestore.length; index++) {
        const guildId = guildsToRestore[index];

        setTimeout(async () => {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) {
                    skippedCount++;
                    return;
                }

                const setupData = global.setupGuilds[guildId];
                if (!setupData?.voiceChannelId) {
                    skippedCount++;
                    return;
                }

                const connectionSuccess = await establishVoiceConnection(guild, guildId, setupData);
                if (!connectionSuccess) {
                    failureCount++;
                    return;
                }

                await resumeGuildPlayback(guildId);
                successCount++;
            } catch (error) {
                if (error.message?.includes('maximum player capacity')) {
                    scheduleDelayedCapacityRetry(client, guildId);
                } else {
                    logger.error(`Error Restoring Guild ${guildId}`, error);
                    failureCount++;
                }
            } finally {
                if (successCount + failureCount + skippedCount === guildsToRestore.length) {
                    logger.info(`State Restoration Complete ${successCount} Restored ${failureCount} Failed ${skippedCount} Skipped`);
                    auditLogger.logVoiceRecoverySummary({
                        restored: successCount,
                        failed: failureCount,
                        skipped: skippedCount,
                        total: guildsToRestore.length,
                    });
                    restorationActive = false;
                }
            }
        }, index * 1700);
    }
}

module.exports.restoreGuildStates = restoreGuildStates;
