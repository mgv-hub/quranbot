const coreLoader = require('@bot/bootstrap');
const botClient = global.client;
const { handleInteraction } = require('@interactions/interactionProcessor');
const { getErrorType } = require('@interactions/interactionErrors');

// Initialize rate limit map and attach auto-cleanup interval
if (!global.interactionRateLimits) {
    global.interactionRateLimits = new Map();
}
setInterval(() => {
    if (!global.interactionRateLimits || !global.interactionRateLimits.size) return;
    const now = Date.now();
    const threshold = 2000; // 2s TTL provides safe margin for duplicate detection
    for (const [key, ts] of global.interactionRateLimits.entries()) {
        if (now - ts > threshold) global.interactionRateLimits.delete(key);
    }
}, 5000);

botClient.on('interactionCreate', async (interaction) => {
    try {
        const isAnySelectMenu =
            interaction.isStringSelectMenu() ||
            interaction.isChannelSelectMenu() ||
            interaction.isRoleSelectMenu() ||
            interaction.isUserSelectMenu() ||
            interaction.isMentionableSelectMenu();
        if (!interaction.isCommand() && !interaction.isButton() && !isAnySelectMenu && !interaction.isModalSubmit()) {
            return;
        }
        if (interaction.user.id === botClient.user.id) {
            return;
        }
        const interactionId = `${interaction.guildId}-${interaction.user.id}-${interaction.id}`;
        // Enforce 500ms minimum interval between identical interactions from same user
        if (global.interactionRateLimits && global.interactionRateLimits.has(interactionId)) {
            const lastTime = global.interactionRateLimits.get(interactionId);
            const now = Date.now();
            if (now - lastTime < 500) {
                coreLoader.logger.debug(`Ignored Fast Duplicate Interaction ${interactionId}`);
                return;
            }
        }
        global.interactionRateLimits.set(interactionId, Date.now());
        await handleInteraction(interaction);
    } catch (criticalError) {
        coreLoader.logger.critical('Unexpected Error In Interaction Handler');
        try {
            if (interaction && !interaction.replied && !interaction.deferred) {
                const errorType = getErrorType(criticalError);
                if (errorType !== 'INTERACTION_EXPIRED') {
                    await interaction.deferUpdate();
                    await interaction.editReply({
                        content: 'حدث خطأ حرج في النظام جاري المحاولة لاستعادة الخدمة',
                        flags: coreLoader.MessageFlags.Ephemeral,
                    });
                    setTimeout(async () => {
                        try {
                            await interaction.editReply({
                                content: 'تم استعادة النظام بنجاح يرجى المحاولة مرة اخرى',
                                flags: coreLoader.MessageFlags.Ephemeral,
                            });
                        } catch (recoveryError) {
                            coreLoader.logger.debug('Failed To Recover Error Message');
                        }
                    }, 2000);
                }
            }
        } catch (replyError) {
            coreLoader.logger.error('Failed To Send Critical Error Message To User');
        }
    }
});

require('@global/globalAll');
