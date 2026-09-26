const logger = require('@infrastructure/Logging/Logger');
const { checkRateLimit } = require('@state/Cooldown');

// Check if user interaction should be blocked due to global cooldown or rate limiting
async function checkGlobalCooldown(interaction) {
    const userId = interaction.user.id;
    
    // Added await: isUserInGlobalCooldown is async and returns a Promise, which is always truthy without await
    if (global.isUserInGlobalCooldown && (await global.isUserInGlobalCooldown(userId))) {
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'أنت في وضع الانتظار المؤقت بسبب كثرة الطلبات. يرجى المحاولة لاحقًا.',
                    flags: 64,
                });
            } else if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'أنت في وضع الانتظار المؤقت بسبب كثرة الطلبات. يرجى المحاولة لاحقًا.',
                    flags: 64,
                });
            }
            logger.warn(`Blocked Interaction From User ${userId} Due To Global Cooldown`);
            return true;
        } catch (error) {
            logger.debug('Failed To Send Cooldown Message To User');
            return true;
        }
    }

    // Check guild-specific rate limits
    const rateLimitResult = await checkRateLimit(userId, interaction.guildId);
    if (!rateLimitResult.valid) {
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: rateLimitResult.message,
                    flags: 64,
                });
            } else if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: rateLimitResult.message,
                    flags: 64,
                });
            }
            logger.warn(`Blocked Interaction From User ${userId} Due To Rate Limit`);
            return true;
        } catch (error) {
            logger.error('Failed To Send Rate Limit Message');
            return true;
        }
    }
    return false;
}

module.exports.checkGlobalCooldown = checkGlobalCooldown;
