const { safeReply } = require('@interactions/flow/responder');

module.exports = {
    customId: 'spread_bot_continue',
    async execute(interaction) {
        const components = [
            {
                type: 17,
                accent_color: 0xfefdfe,
                components: [
                    {
                        type: 10,
                        content: '### اختر القناة',
                    },
                    { type: 14, divider: true, spacing: 1 },

                    {
                        type: 10,
                        content: 'اختر القناة النصية التي تريد إرسال رسالة التعريف بالبوت إليها.\nيُرجى اختيار قناة يراها الأعضاء.',
                    },

                    {
                        type: 1,
                        components: [
                            {
                                type: 8,
                                custom_id: 'spread_bot_channel',
                                placeholder: 'اختر قناة نصية',
                                channel_types: [0, 5],
                                min_values: 1,
                                max_values: 1,
                            },
                        ],
                    },
                ],
            },
        ];

        await safeReply(interaction, { components, flags: 32832 }, 'spread_bot_select');
    },
};
