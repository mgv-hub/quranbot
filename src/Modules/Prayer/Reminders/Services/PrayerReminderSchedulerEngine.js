const logger = require('@infrastructure/Logging/Logger');
const prayerReminderManager = require('@modules/Prayer/Reminders/Services/PrayerReminderManager');
const state = require('@modules/Prayer/Reminders/Services/PrayerReminderState');
const { startCacheCleanup } = require('@modules/Prayer/Reminders/Services/PrayerReminderApi');
const { calculateDailyJobs, processQueue } = require('@modules/Prayer/Reminders/Services/PrayerReminderQueue');

function stopScheduler() {
    if (state.schedulerState === 'STOPPED' || state.schedulerState === 'STOPPING') return;

    state.schedulerState = 'STOPPING';
    state.currentGeneration++;

    if (state.schedulerTimeout) {
        clearTimeout(state.schedulerTimeout);
        state.schedulerTimeout = null;
    }

    state.schedulerState = 'STOPPED';
    logger.prayer('Scheduler stopped', { generation: state.currentGeneration });
}

async function startScheduler() {
    if (state.schedulerState === 'RUNNING' || state.schedulerState === 'STARTING') return;

    state.schedulerState = 'STARTING';

    while (!prayerReminderManager.isInitialized) {
        await new Promise((r) => setTimeout(r, 1000));
    }

    startCacheCleanup();
    state.schedulerState = 'RUNNING';

    await calculateDailyJobs();

    processQueue().catch((err) => {
        logger.prayer('Queue processing error', { error: err.message });
    });

    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setUTCHours(24, 5, 0, 0);
    const delay = nextMidnight.getTime() - now.getTime();

    logger.prayer('Scheduler cycle complete, scheduling next reconciliation', { delayMs: delay, nextRunAt: nextMidnight.toISOString() });

    state.schedulerTimeout = setTimeout(async () => {
        if (state.schedulerState === 'RUNNING') {
            await calculateDailyJobs();
        }
    }, delay);
}

function _setSchedulerState(newState) {
    state.schedulerState = newState;
}

module.exports.startScheduler = startScheduler;
module.exports.stopScheduler = stopScheduler;
module.exports._setSchedulerState = _setSchedulerState;
