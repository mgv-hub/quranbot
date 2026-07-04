const coreLoader = require('@bot/bootstrap');

// Check if user interaction should be blocked due to global cooldown or rate limiting
async function checkGlobalCooldown(interaction) {
    const userId = interaction.user.id;
    if (coreLoader.isUserInGlobalCooldown(userId)) {
        try {
            if (!interaction.replied && !interaction.deferred) {
                if (interaction.isCommand()) {
                    await interaction.reply({
                        content: 'أنت في وضع الانتظار المؤقت بسبب كثرة الطلبات. يرجى المحاولة لاحقًا.',
                        ephemeral: true,
                    });
                } else {
                    await interaction.reply({
                        content: 'أنت في وضع الانتظار المؤقت بسبب كثرة الطلبات. يرجى المحاولة لاحقًا.',
                        ephemeral: true,
                    });
                }
            } else if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'أنت في وضع الانتظار المؤقت بسبب كثرة الطلبات. يرجى المحاولة لاحقًا.',
                    ephemeral: true,
                });
            }

            coreLoader.logger.warn(`Blocked Interaction From User ${userId} Due To Global Cooldown`);
            return true;
        } catch (error) {
            coreLoader.logger.debug('Failed To Send Cooldown Message To User');
            return true;
        }
    }

    // Check guild-specific rate limits
    const rateLimitResult = coreLoader.checkRateLimit(userId, interaction.guildId);
    if (!rateLimitResult.valid) {
        try {
            if (!interaction.replied && !interaction.deferred) {
                if (interaction.isCommand()) {
                    await interaction.reply({
                        content: rateLimitResult.message,
                        ephemeral: true,
                    });
                } else {
                    await interaction.reply({
                        content: rateLimitResult.message,
                        ephemeral: true,
                    });
                }
            } else if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: rateLimitResult.message,
                    ephemeral: true,
                });
            }

            coreLoader.logger.warn(`Blocked Interaction From User ${userId} Due To Rate Limit`);
            return true;
        } catch (error) {
            coreLoader.logger.error('Failed To Send Rate Limit Message');
            return true;
        }
    }
    return false;
}

module.exports.checkGlobalCooldown = checkGlobalCooldown;
