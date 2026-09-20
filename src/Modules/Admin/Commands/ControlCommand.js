const { wrapInteraction, safeError } = require('@infrastructure/Discord/Flow/DeferReply');
const { resolveGuildState } = require('@core/Auth/AuthGuard');
const { rebuildAndSendControlPanel } = require('@infrastructure/Discord/UI/ControlPanelBuilder');
const logger = require('@infrastructure/Logging/Logger');

module.exports = {
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                // No need to check authorization here since the control panel will show different options based on the user's permissions and the guild's control mode
                const { guildId, guildState } = resolveGuildState(interaction);
                if (!guildState) {
                    await safeError(interaction, 'لم يتم العثور على حالة السيرفر');
                    return;
                }
                if (!global.surahNames || global.surahNames.length === 0) {
                    await safeError(interaction, 'جاري تحميل البيانات يرجى الانتظار قليلا ثم استخدم الامر مرة اخرى');
                    return;
                }
                if (!global.reciters || Object.keys(global.reciters).length === 0) {
                    await safeError(interaction, 'جاري تحميل القراء يرجى الانتظار قليلا ثم استخدم الامر مرة اخرى');
                    return;
                }
                await rebuildAndSendControlPanel(interaction, guildState, guildId);
            },
            { context: { label: 'control_command', logger } },
        );
    },
};
