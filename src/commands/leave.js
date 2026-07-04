const { wrapInteraction, safeError } = require('@interactions/flow/deferReply');
const { resolveGuildState } = require('@auth/guard');
const { teardownConnection, syncVoiceState, stopPlayer } = require('@audio');
const persistentState = require('@state/PersistentStateManager');
const logger = require('@logging/logger');
const voiceLogger = require('@logging/voiceLogger');

module.exports = {
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const { guildId, guildState } = resolveGuildState(interaction);
                voiceLogger.connection(guildId, 'Leave command executed', {
                    userId: interaction.user.id,
                    hasConnection: !!guildState?.connection,
                    connectionDestroyed: guildState?.connection?.destroyed,
                });
                if (guildState.connection && !guildState.connection.destroyed) {
                    voiceLogger.connection(guildId, 'Stopping player before disconnect');
                    stopPlayer(guildState);
                    guildState.isPaused = true;
                    guildState.pauseReason = 'manual_leave';
                    voiceLogger.connection(guildId, 'Tearing down voice connection');
                    await teardownConnection(guildId, guildState);
                    persistentState.setManualDisconnect(guildId, true);
                    voiceLogger.connection(guildId, 'Manual disconnect flag set');
                    await syncVoiceState(guildId, guildState);
                    voiceLogger.connection(guildId, 'Voice state synced after leave');
                    await interaction.editReply({
                        content: 'تم الخروج من الغرفة الصوتية بنجاح',
                        flags: 64,
                    });
                    voiceLogger.connection(guildId, 'Leave command completed successfully');
                } else {
                    voiceLogger.connection(guildId, 'Leave skipped - no active connection', {
                        hasConnection: !!guildState?.connection,
                        destroyed: guildState?.connection?.destroyed,
                    });
                    await interaction.editReply({
                        content: 'البوت غير موجود في روم صوتي حاليا',
                        flags: 64,
                    });
                }
            },
            { context: { label: 'leave_command', logger } },
        );
    },
};
