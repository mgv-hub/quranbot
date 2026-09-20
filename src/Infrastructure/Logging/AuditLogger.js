const logger = require('@infrastructure/Logging/Logger');
const formatTimeDuration = require('@shared/Formatting/FormatUptime');
const auditLogBuffer = [];
const flush = 5000;
const buffer = 100;

function getLogAdminUserId() {
    return process.env.LOG_ADMIN_USER_ID;
}

function logChannelCreation(guild, action, details, user) {
    const entry = {
        timestamp: new Date().toISOString(),
        guildId: guild?.id || 'unknown',
        guildName: guild?.name || 'unknown',
        action: action,
        details: details,
        userTag: user?.tag || 'Unknown',
        userId: user?.id || 'Unknown',
        isCritical: false,
    };
    auditLogBuffer.push(entry);
    logger.info(`Channel ${action} | Guild: ${guild?.name} (${guild?.id}) | ${details.channelName || 'unknown'} (${details.channelId || 'unknown'})`);
    if (auditLogBuffer.length >= buffer) {
        flushAuditLogs();
    }
}

function logChannelDeletion(guild, action, details, user) {
    const entry = {
        timestamp: new Date().toISOString(),
        guildId: guild?.id || 'unknown',
        guildName: guild?.name || 'unknown',
        action: action,
        details: details,
        userTag: user?.tag || 'Unknown',
        userId: user?.id || 'Unknown',
        isCritical: true,
    };
    auditLogBuffer.push(entry);
    logger.warn(`Channel ${action} | Guild: ${guild?.name} (${guild?.id}) | ${details.channelName || 'unknown'} (${details.channelId || 'unknown'})`);
    if (auditLogBuffer.length >= buffer) {
        flushAuditLogs();
    }
}

function logSetupOperation(guild, operation, oldChannels, newChannels, reason, user) {
    const entry = {
        timestamp: new Date().toISOString(),
        guildId: guild?.id || 'unknown',
        guildName: guild?.name || 'unknown',
        operation: operation,
        oldChannels: oldChannels,
        newChannels: newChannels,
        reason: reason,
        userTag: user?.tag || 'Unknown',
        userId: user?.id || 'Unknown',
        isCritical: true,
    };
    auditLogBuffer.push(entry);
    const oldChannelIds = oldChannels ? Object.values(oldChannels).filter(Boolean).join(', ') : 'none';
    const newChannelIds = newChannels ? Object.values(newChannels).filter(Boolean).join(', ') : 'none';
    logger.info(`${operation} | Guild: ${guild?.name} (${guild?.id}) | Old: ${oldChannelIds} | New: ${newChannelIds} | Reason: ${reason}`);
}

function logBlockedDeletion(guild, channelId, channelName, reason, user) {
    const entry = {
        timestamp: new Date().toISOString(),
        guildId: guild?.id || 'unknown',
        guildName: guild?.name || 'unknown',
        action: 'DELETE_FAILED',
        channelId: channelId,
        channelName: channelName,
        reason: reason,
        userTag: user?.tag || 'Unknown',
        userId: user?.id || 'Unknown',
        isCritical: true,
    };
    auditLogBuffer.push(entry);
    logger.warn(`Deletion | Guild: ${guild?.name} (${guild?.id}) | Channel: ${channelName} (${channelId}) | Reason: ${reason}`);
}

function logGuildJoin(guild, user) {
    const entry = {
        timestamp: new Date().toISOString(),
        guildId: guild?.id || 'unknown',
        guildName: guild?.name || 'unknown',
        action: 'GUILD_JOIN',
        memberCount: guild?.memberCount || 0,
        userTag: user?.tag || 'Unknown',
        userId: user?.id || 'Unknown',
        isCritical: false,
    };
    auditLogBuffer.push(entry);
    logger.info(`[AUDIT] Bot joined guild: ${guild?.name} (${guild?.id}) | Members: ${guild?.memberCount}`);
    if (auditLogBuffer.length >= buffer) {
        flushAuditLogs();
    }
}

function logGuildLeave(guild) {
    const joinedAt = guild?.joinedTimestamp || Date.now();
    const durationMs = Date.now() - joinedAt;
    const durationFormatted = formatTimeDuration(durationMs, 'en');
    const entry = {
        timestamp: new Date().toISOString(),
        guildId: guild?.id || 'unknown',
        guildName: guild?.name || 'unknown',
        action: 'GUILD_LEAVE',
        memberCount: guild?.memberCount || 0,
        duration: durationFormatted,
        isCritical: true,
    };
    auditLogBuffer.push(entry);
    logger.info(`[AUDIT] Bot left guild: ${guild?.name} (${guild?.id}) | Duration: ${durationFormatted}`);
    if (auditLogBuffer.length >= buffer) {
        flushAuditLogs();
    }
}

function logVoiceChannelChange(guild, oldChannelId, newChannelId, user) {
    const entry = {
        timestamp: new Date().toISOString(),
        guildId: guild?.id || 'unknown',
        guildName: guild?.name || 'unknown',
        action: 'VOICE_CHANNEL_CHANGE',
        oldChannelId: oldChannelId || 'None',
        newChannelId: newChannelId || 'None',
        userTag: user?.tag || 'Unknown',
        userId: user?.id || 'Unknown',
        isCritical: true,
    };
    auditLogBuffer.push(entry);
    logger.info(`[AUDIT-VOICE] Voice channel changed | Guild: ${guild?.name} (${guild?.id}) | Old: ${oldChannelId} | New: ${newChannelId}`);
}

function logVoiceExternalDisconnect(guild, channelId, user) {
    const entry = {
        timestamp: new Date().toISOString(),
        guildId: guild?.id || 'unknown',
        guildName: guild?.name || 'unknown',
        action: 'VOICE_EXTERNAL_DISCONNECT',
        channelId: channelId || 'None',
        userTag: user?.tag || 'Unknown',
        userId: user?.id || 'Unknown',
        isCritical: true,
    };
    auditLogBuffer.push(entry);
    logger.info(`[AUDIT-VOICE] Bot externally disconnected | Guild: ${guild?.name} (${guild?.id}) | Channel: ${channelId}`);
}

function logVoiceExternalJoin(guild, channelId, user) {
    const entry = {
        timestamp: new Date().toISOString(),
        guildId: guild?.id || 'unknown',
        guildName: guild?.name || 'unknown',
        action: 'VOICE_EXTERNAL_JOIN',
        channelId: channelId || 'None',
        userTag: user?.tag || 'Unknown',
        userId: user?.id || 'Unknown',
        isCritical: false,
    };
    auditLogBuffer.push(entry);
    logger.info(`[AUDIT-VOICE] Bot externally joined | Guild: ${guild?.name} (${guild?.id}) | Channel: ${channelId}`);
}

function logVoiceRecoverySummary(stats) {
    const entry = {
        timestamp: new Date().toISOString(),
        action: 'VOICE_RECOVERY_SUMMARY',
        restored: stats.restored || 0,
        failed: stats.failed || 0,
        skipped: stats.skipped || 0,
        total: stats.total || 0,
        isCritical: false,
    };
    auditLogBuffer.push(entry);
    logger.info(`[AUDIT-VOICE] Recovery completed: ${entry.restored}/${entry.total} restored, ${entry.failed} failed, ${entry.skipped} skipped`);
}

async function flushAuditLogs() {
    if (auditLogBuffer.length === 0) return;
    const entries = auditLogBuffer.splice(0, auditLogBuffer.length);
    const adminUserId = getLogAdminUserId();

    if (!adminUserId) {
        logger.warn('add LOG_ADMIN_USER_ID in env');
        return;
    }

    try {
        const client = global.client;
        if (!client) return;
        const user = await client.users.fetch(adminUserId).catch(() => null);
        if (!user) {
            logger.warn(`Audit log skipped: Admin user with ID ${adminUserId} not found.`);
            return;
        }
        const importantEntries = entries.filter((e) => e.isCritical || e.action === 'GUILD_JOIN' || e.action === 'GUILD_LEAVE' || e.action === 'VOICE_RECOVERY_SUMMARY' || e.action === 'VOICE_EXTERNAL_DISCONNECT' || e.action === 'VOICE_EXTERNAL_JOIN');
        if (importantEntries.length === 0) return;

        const components = [
            {
                type: 17,
                accent_color: 0xfefdfe,
                components: [
                    {
                        type: 10,
                        content: `### System Audit`,
                    },
                    {
                        type: 14,
                        spacing: 1,
                    },
                    {
                        type: 10,
                        content: `Logged **${importantEntries.length}** significant system events`,
                    },
                    {
                        type: 14,
                        spacing: 2,
                    },
                ],
            },
        ];

        for (const entry of importantEntries.slice(0, 10)) {
            let content = '';
            const triggerInfo = (entry.userTag && entry.userTag !== 'Unknown' && entry.userId && entry.userId !== 'Unknown')
                ? `
**Triggered By:** ${entry.userTag} (\`${entry.userId}\`)`
                : '';
            const timeStr = new Date(entry.timestamp).toLocaleTimeString('en-US', { timeZone: 'Africa/Cairo' });

            if (entry.action === 'GUILD_JOIN') {
                content = `**Event:** Bot Added to Server
**Members:** ${entry.memberCount}${triggerInfo}`;
            } else if (entry.action === 'GUILD_LEAVE') {
                content = `**Event:** Bot Removed from Server
**Members:** ${entry.memberCount}
**Duration in Server:** ${entry.duration}${triggerInfo}`;
            } else if (entry.action === 'DELETE_FAILED') {
                content = `**Event:** Blocked Channel Deletion
**Channel:** ${entry.channelName} (\`${entry.channelId}\`)
**Reason:** ${entry.reason}${triggerInfo}`;
            } else if (entry.action === 'VOICE_CHANNEL_CHANGE') {
                content = `**Event:** Voice Channel Changed
**Old Channel:** \`${entry.oldChannelId}\`
**New Channel:** \`${entry.newChannelId}\`${triggerInfo}`;
            } else if (entry.action === 'VOICE_EXTERNAL_DISCONNECT') {
                content = `**Event:** Bot Disconnected From Voice
**Channel:** \`${entry.channelId}\`${triggerInfo}`;
            } else if (entry.action === 'VOICE_EXTERNAL_JOIN') {
                content = `**Event:** Bot Joined Voice Externally
**Channel:** \`${entry.channelId}\`${triggerInfo}`;
            } else if (entry.action === 'VOICE_RECOVERY_SUMMARY') {
                content = `**Event:** Voice Recovery Summary
**Restored:** ${entry.restored}/${entry.total}
**Failed:** ${entry.failed}
**Skipped:** ${entry.skipped}`;
            } else if (entry.operation) {
                const oldCh = entry.oldChannels ? Object.entries(entry.oldChannels).map(([k, v]) => `${k}: ${v || 'None'}`).join(', ') : 'None';
                const newCh = entry.newChannels ? Object.entries(entry.newChannels).map(([k, v]) => `${k}: ${v || 'None'}`).join(', ') : 'None';
                content = `**Event:** ${entry.operation}
**Reason:** ${entry.reason}${triggerInfo}
**Old Channels:** ${oldCh}
**New Channels:** ${newCh}`;
            } else {
                const actionText = entry.action === 'CREATE' ? 'Channel Created' : 'Channel Deleted';
                content = `**Event:** ${actionText}
**Channel:** ${entry.details?.channelName || 'Unknown'} (\`${entry.details?.channelId || 'Unknown'}\`)
**Type:** ${entry.details?.channelType || 'Unknown'}${triggerInfo}`;
            }

            components[0].components.push(
                {
                    type: 10,
                    content: `**${entry.guildName || 'System'}** (\`${entry.guildId || 'N/A'}\`) • ${timeStr}`,
                },
                {
                    type: 14,
                    spacing: 1,
                },
                {
                    type: 10,
                    content: content,
                },
                {
                    type: 14,
                    spacing: 2,
                }
            );
        }

        try {
            await user.send({
                components,
                flags: 32768
            });
        } catch (sendErr) {
            if (sendErr.code === 50007) {
                logger.error(`Audit log fail: DMs are disabled for user ${adminUserId}`);
            } else {
                try {
                    const fallbackText = `**System Audit Report**\nLogged **${importantEntries.length}** significant system events.`;
                    await user.send(fallbackText);
                } catch (fallbackErr) {
                    logger.error(`Audit log fail ${fallbackErr.message}`);
                }
            }
        }
    } catch (err) {
        logger.error(`Audit log fail ${err.message}`);
    }
}

function startAuditFlushInterval() {
    setInterval(flushAuditLogs, flush);
}

function getAuditBuffer() {
    return [...auditLogBuffer];
}

function clearAuditBuffer() {
    auditLogBuffer.length = 0;
}

module.exports.logChannelCreation = logChannelCreation;
module.exports.logChannelDeletion = logChannelDeletion;
module.exports.logSetupOperation = logSetupOperation;
module.exports.logBlockedDeletion = logBlockedDeletion;
module.exports.logGuildJoin = logGuildJoin;
module.exports.logGuildLeave = logGuildLeave;
module.exports.logVoiceChannelChange = logVoiceChannelChange;
module.exports.logVoiceExternalDisconnect = logVoiceExternalDisconnect;
module.exports.logVoiceExternalJoin = logVoiceExternalJoin;
module.exports.logVoiceRecoverySummary = logVoiceRecoverySummary;
module.exports.flushAuditLogs = flushAuditLogs;
module.exports.startAuditFlushInterval = startAuditFlushInterval;
module.exports.getAuditBuffer = getAuditBuffer;
module.exports.clearAuditBuffer = clearAuditBuffer;
module.exports.getLogAdminUserId = getLogAdminUserId;
