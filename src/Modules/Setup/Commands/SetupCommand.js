const { wrapInteraction, safeReply, safeError } = require('@infrastructure/Discord/Flow/Responder');
const { setupQuranCategory } = require('@modules/Setup/Services/SetupQuranCategory');
const bootstrap = require('@core/GlobalBindings');
const { emoji, gif } = require('@shared/Helpers/Emojis');
const { validateSetupPreConditions, warnDoomedChannel } = require('@modules/Setup/Validation/SetupPreChecks');
const { sendSuccessMessage } = require('@modules/Setup/Services/SetupSuccessHandler');

module.exports = {
    async execute(interaction) {
        return await wrapInteraction(
            interaction,
            async () => {
                if (!interaction.guild) {
                    await safeError(interaction, 'هذا الأمر يمكن استخدامه فقط داخل السيرفرات وليس في الرسائل الخاصة', 'setup_dm_check');
                    return false;
                }

                const preCheck = await validateSetupPreConditions(interaction);
                if (!preCheck.valid) {
                    return false;
                }
                const { isReSetup, channelWillBeDeleted } = preCheck;

                await warnDoomedChannel(interaction, channelWillBeDeleted);

                const setupResult = await setupQuranCategory(interaction.guild, interaction, {
                    channelWillBeDeleted,
                });

                await sendSuccessMessage(interaction, setupResult, isReSetup, channelWillBeDeleted);
            },
            { ephemeral: true, label: 'setup_command' },
        );
    },
};
