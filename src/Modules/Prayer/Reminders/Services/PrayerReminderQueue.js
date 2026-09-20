const logger = require('@infrastructure/Logging/Logger');
const prayerReminderManager = require('@modules/Prayer/Reminders/Services/PrayerReminderManager');
const { prayer_reminder_config } = require('@config/Constants');
const { PRAYER_MAP } = require('@modules/Prayer/Reminders/Services/PrayerReminderConstants');
const { getUtcTimestampFromAladhan, buildReminderComponents } = require('@modules/Prayer/Reminders/Services/PrayerReminderUtils');
const { fetchPrayerTimesWithTimezone } = require('@modules/Prayer/Reminders/Services/PrayerReminderApi');
const state = require('@modules/Prayer/Reminders/Services/PrayerReminderState');

async function calculateDailyJobs() {
    if (state.schedulerState !== 'RUNNING' && state.schedulerState !== 'RECONCILING') return;

    if (state.isCalculating) {
        state.isCalculationDirty = true;
        return;
    }

    state.isCalculating = true;
    const myGeneration = ++state.currentGeneration;

    try {
        while (true) {
            state.isCalculationDirty = false;
            const reminders = prayerReminderManager.getAll();
            const newJobs = [];
            const apiGroups = new Map();
            const now = Date.now();

            logger.prayer('Starting daily prayer reminder calculation', {
                totalReminders: reminders.length,
                generation: myGeneration,
            });

            for (const r of reminders) {
                if (!r.enabled || !r.channelId || !Array.isArray(r.prayers) || r.prayers.length === 0) continue;
                const timezone = r.timezone || 'Africa/Cairo';
                const key = `${r.lat.toFixed(4)},${r.lng.toFixed(4)},${r.method},${timezone}`;
                if (!apiGroups.has(key)) {
                    apiGroups.set(key, { lat: r.lat, lng: r.lng, method: r.method, timezone, reminders: [] });
                }
                apiGroups.get(key).reminders.push(r);
            }

            const apiEntries = Array.from(apiGroups.values());
            const apiResults = new Map();

            for (const apiData of apiEntries) {
                const key = `${apiData.lat.toFixed(4)},${apiData.lng.toFixed(4)},${apiData.method},${apiData.timezone}`;
                const prayerData = await fetchPrayerTimesWithTimezone(apiData.lat, apiData.lng, apiData.method, apiData.timezone);
                if (prayerData) {
                    apiResults.set(key, prayerData);
                }
            }

            const dedupSet = new Set();
            for (const [key, apiData] of apiGroups.entries()) {
                const prayerData = apiResults.get(key);
                if (!prayerData) continue;

                for (const r of apiData.reminders) {
                    const uniquePrayers = [...new Set(r.prayers)].filter((p) => prayer_reminder_config.valid_prayers.has(p));

                    for (const prayerKey of uniquePrayers) {
                        const apiPrayerName = PRAYER_MAP[prayerKey];
                        if (!apiPrayerName || !prayerData.timings[apiPrayerName]) continue;
                        const dedupKey = `${r.guildId}:${prayerKey}:${prayerData.dateStr}`;
                        if (dedupSet.has(dedupKey)) continue;
                        dedupSet.add(dedupKey);
                        let adhanTimestamp;
                        try {
                            adhanTimestamp = getUtcTimestampFromAladhan(prayerData.dateStr, prayerData.timings[apiPrayerName], prayerData.timezone);
                        } catch (err) {
                            logger.prayer('Timezone conversion failed', { guildId: r.guildId, prayer: prayerKey, error: err.message });
                            continue;
                        }

                        const sendTimestamp = adhanTimestamp - prayer_reminder_config.reminder_buffer_ms;
                        if (sendTimestamp < now) continue;

                        newJobs.push({
                            id: `${r.guildId}:${prayerKey}:${prayerData.dateStr}`,
                            guildId: r.guildId,
                            channelId: r.channelId,
                            prayerName: prayerKey,
                            localDate: prayerData.dateStr,
                            timezone: prayerData.timezone,
                            adhanTimestamp,
                            sendTimestamp,
                            countryCode: r.countryCode,
                            cityName: r.cityName || 'Unknown',
                            countryName: r.countryName || 'Unknown',
                            method: r.method,
                            generation: myGeneration,
                            configVersion: r.configVersion || 0,
                            roles: r.roles || [],
                            mentionEveryone: r.mentionEveryone || false,
                            mentionHere: r.mentionHere || false,
                        });
                    }
                }
            }
            newJobs.sort((a, b) => a.sendTimestamp - b.sendTimestamp);

            for (let i = 1; i < newJobs.length; i++) {
                if (newJobs[i].sendTimestamp <= newJobs[i - 1].sendTimestamp) {
                    const adjusted = newJobs[i - 1].sendTimestamp + prayer_reminder_config.rate_delay_ms;
                    const maxAllowed = newJobs[i].adhanTimestamp - prayer_reminder_config.reminder_buffer_ms + prayer_reminder_config.max_collision_drift_ms;
                    newJobs[i].sendTimestamp = Math.min(adjusted, maxAllowed);
                }
            }

            if (myGeneration !== state.currentGeneration || state.schedulerState !== 'RUNNING') {
                logger.prayer('Calculation superseded or scheduler stopped, discarding results', { generation: myGeneration });
                break;
            }
            state.dailyJobs = newJobs;
            state.queueIndex = 0;
            const jobsByPrayer = {};

            for (const j of state.dailyJobs) {
                jobsByPrayer[j.prayerName] = (jobsByPrayer[j.prayerName] || 0) + 1;
            }

            logger.prayer('Daily prayer reminder calculation completed', {
                totalValidJobs: state.dailyJobs.length,
                generation: myGeneration,
                breakdown: jobsByPrayer,
            });

            if (!state.isCalculationDirty) break;
        }
    } catch (error) {
        logger.prayer('Calculation failed', { generation: myGeneration, error: error.message });
    } finally {
        state.isCalculating = false;
        if (state.isCalculationDirty && state.schedulerState === 'RUNNING') {
            calculateDailyJobs();
        }
    }
}

async function sendSingleJob(job) {
    const scheduledTime = job.sendTimestamp;
    const actualTime = Date.now();
    const driftMs = actualTime - scheduledTime;
    const overdueMs = Math.max(0, driftMs);

    if (overdueMs > prayer_reminder_config.overdue_tolerance_ms) {
        logger.prayer('Skipping overdue prayer reminder job', {
            jobId: job.id,
            guildId: job.guildId,
            channelId: job.channelId,
            prayerName: job.prayerName,
            overdueByMs: overdueMs,
            generation: job.generation,
        });
        return;
    }

    const currentConfig = prayerReminderManager.get(job.guildId);

    if (!currentConfig || !currentConfig.enabled || currentConfig.configVersion !== job.configVersion) {
        logger.prayer('Skipping invalidated prayer reminder job', {
            jobId: job.id,
            guildId: job.guildId,
            reason: 'Configuration changed or disabled',
        });
        return;
    }

    const timeUntilAdhanMs = job.adhanTimestamp - Date.now();
    const components = buildReminderComponents(job, timeUntilAdhanMs);
    const client = global.client;
    if (!client) return;
    let channel = client.channels?.cache?.get(job.channelId);

    if (!channel) {
        try {
            channel = await client.channels.fetch(job.channelId);
        } catch {
            channel = null;
        }
    }

    if (!channel || !channel.isTextBased?.()) {
        logger.prayer('Channel unavailable for prayer reminder', {
            jobId: job.id,
            guildId: job.guildId,
            channelId: job.channelId,
            prayerName: job.prayerName,
        });
        return;
    }

    const parseMentions = [];
    if (job.mentionEveryone || job.mentionHere) parseMentions.push('everyone');
    if (job.roles && job.roles.length > 0) parseMentions.push('roles');

    for (let attempt = 0; attempt <= prayer_reminder_config.discord_max_retries; attempt++) {
        try {
            if (attempt > 0) {
                await new Promise((r) => setTimeout(r, prayer_reminder_config.discord_retry_delay_ms));
            }

            await channel.send({ components, flags: 32768, allowed_mentions: { parse: parseMentions } });
            logger.prayer('Prayer reminder sent successfully', {
                jobId: job.id,
                guildId: job.guildId,
                channelId: job.channelId,
                prayerName: job.prayerName,
                cityName: job.cityName,
                countryName: job.countryName,
                driftMs,
                actualSentAt: new Date().toISOString(),
            });
            return;
        } catch (err) {
            if (attempt === prayer_reminder_config.discord_max_retries) {
                logger.prayer('Failed to send prayer reminder', {
                    jobId: job.id,
                    guildId: job.guildId,
                    channelId: job.channelId,
                    prayerName: job.prayerName,
                    errorCode: err.code,
                    errorMessage: err.message,
                });
            }
        }
    }
}

async function processQueue() {
    if (state.schedulerState !== 'RUNNING') return;
    while (state.schedulerState === 'RUNNING') {
        if (state.queueIndex >= state.dailyJobs.length) {
            state.queueIndex = 0;
            state.dailyJobs = [];
            logger.prayer('Queue empty, waiting for new jobs or reconciliation');

            await new Promise((resolve) => {
                state.schedulerTimeout = setTimeout(resolve, 60000);
            });
            continue;
        }

        const job = state.dailyJobs[state.queueIndex];
        const now = Date.now();
        const waitTime = job.sendTimestamp - now;

        if (waitTime > 0) {
            logger.prayer('Waiting to send prayer reminder', {
                jobId: job.id,
                guildId: job.guildId,
                channelId: job.channelId,
                prayerName: job.prayerName,
                waitTimeMs: waitTime,
                scheduledSendAt: new Date(job.sendTimestamp).toISOString(),
            });

            await new Promise((resolve) => {
                state.schedulerTimeout = setTimeout(resolve, waitTime);
            });
            if (state.schedulerState !== 'RUNNING') break;

            continue;
        }

        state.queueIndex++;
        await sendSingleJob(job);

        if (state.queueIndex % prayer_reminder_config.send_concurrency === 0) {
            await new Promise((r) => setTimeout(r, prayer_reminder_config.rate_delay_ms));
        }
    }
}

function wakeQueue() {
    if (state.schedulerTimeout) {
        clearTimeout(state.schedulerTimeout);
        state.schedulerTimeout = null;
    }
}

function getDailyJobs() {
    return state.dailyJobs.slice(state.queueIndex);
}

module.exports.calculateDailyJobs = calculateDailyJobs;
module.exports.sendSingleJob = sendSingleJob;
module.exports.processQueue = processQueue;
module.exports.wakeQueue = wakeQueue;
module.exports.getDailyJobs = getDailyJobs;
