const retentiondb = require('@infrastructure/Persistence/Firebase/Retention/RetentionIndex');

module.exports.markGuildAsLeft = retentiondb.markGuildAsLeft;
module.exports.markGuildAsPresent = retentiondb.markGuildAsPresent;
module.exports.cleanExpiredLeftData = retentiondb.cleanExpiredLeftData;
module.exports.retention_days = retentiondb.retention_days;
