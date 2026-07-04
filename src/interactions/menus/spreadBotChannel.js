const { safeReply } = require('@interactions/flow/responder');

module.exports = {
    customId: 'spread_bot_channel',
    async execute(interaction) {
        const channelId = interaction.values[0];

        let channel = interaction.guild.channels.cache.get(channelId);

        if (!channel) {
            channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
        }

        if (!channel) {
            return safeReply(interaction, { content: 'لم يتم العثور على القناة المحددة.', flags: 64 }, 'spread_bot_channel_err');
        }

        const components = [
            {
                type: 17,
                accent_color: 0xfefdfe,
                components: [
                    {
                        type: 10,
                        content: '### تأكيد الإرسال',
                    },
                    { type: 14, divider: true, spacing: 1 },
                    {
                        type: 10,
                        content: `هل أنت متأكد من إرسال رسالة التعريف بالبوت إلى <#${channelId}>؟\nسيتم إرسال رسالة عامة مرئية لجميع الأعضاء في هذه القناة.`,
                    },
                    { type: 14, divider: true, spacing: 1 },
                    {
                        type: 1,
                        components: [
                            { type: 2, custom_id: `spread_bot_send_${channelId}`, label: 'نعم، إرسال', style: 2 },
                            { type: 2, custom_id: 'spread_bot_cancel', label: 'إلغاء', style: 2 },
                        ],
                    },
                ],
            },
        ];

        await safeReply(interaction, { components, flags: 32832 }, 'spread_bot_confirm');
    },
};
