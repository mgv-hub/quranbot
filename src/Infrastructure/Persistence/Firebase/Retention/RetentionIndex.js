const core = require('@infrastructure/Persistence/Firebase/Retention/RetentionCore');
const cleaners = require('@infrastructure/Persistence/Firebase/Retention/RetentionCleaners');
const scheduler = require('@infrastructure/Persistence/Firebase/Retention/RetentionScheduler');

module.exports = {
    ...core,
    ...cleaners,
    ...scheduler,
};
