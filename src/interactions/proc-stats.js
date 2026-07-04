const coreLoader = require('@bot/bootstrap');

let StatisticsTracker = null;

// Get or initialize the statistics tracker module with error handling
function getStatisticsTracker() {
    if (!StatisticsTracker) {
        try {
            StatisticsTracker = require('@statistics/StatisticsTracker');
            coreLoader.logger.info('StatisticsTracker loaded successfully');
        } catch (error) {
            coreLoader.logger.error('Failed to load StatisticsTracker:', error.message);
        }
    }
    return StatisticsTracker;
}

// Increment command usage statistics, excluding ping commands to avoid noise
async function incrementCommandStats(commandName) {
    // Skip tracking for ping/latency check commands
    if (commandName === 'سرعة') {
        return;
    }

    try {
        const tracker = getStatisticsTracker();

        if (tracker && tracker.incrementStat && typeof tracker.incrementStat === 'function') {
            tracker.incrementStat('commandsUsed', 1);
        } else {
            coreLoader.logger.warn('StatisticsTracker.incrementStat not available');
        }
    } catch (statError) {
        coreLoader.logger.error('Error incrementing commandsUsed:', statError.message);
    }
}

module.exports.getStatisticsTracker = getStatisticsTracker;
module.exports.incrementCommandStats = incrementCommandStats;
