require('pathlra-aliaser')();

const imp = require('@loader-core_bootstrap');

let StatisticsTracker = null;

function getStatisticsTracker() {
   if (!StatisticsTracker) {
      try {
         StatisticsTracker = require('@StatisticsTracker-core_statistics');
         imp.logger.info('StatisticsTracker loaded successfully');
      } catch (error) {
         imp.logger.error('Failed to load StatisticsTracker:', error.message);
      }
   }
   return StatisticsTracker;
}

async function incrementCommandStats(commandName) {
   if (commandName === 'سرعة') {
      return;
   }
   try {
      const tracker = getStatisticsTracker();
      if (tracker && tracker.incrementStat && typeof tracker.incrementStat === 'function') {
         tracker.incrementStat('commandsUsed', 1);
      } else {
         imp.logger.warn('StatisticsTracker.incrementStat not available');
      }
   } catch (statError) {
      imp.logger.error('Error incrementing commandsUsed:', statError.message);
   }
}

module.exports.getStatisticsTracker = getStatisticsTracker;
module.exports.incrementCommandStats = incrementCommandStats;
