const { wrapInteraction, safeReply, safeError } = require('@interactions/flow/responder');
const { setupQuranCategory } = require('@setup/setupQuranCategory');
const bootstrap = require('@bot/bootstrap');
const { emoji, gif } = require('@helpers/emojis');
const { validateSetupPreConditions, warnDoomedChannel } = require('@setup/setupPreChecks');
const { sendSuccessMessage } = require('@setup/setupSuccessHandler');

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
