module.exports = {
    customId: 'spread_bot_cancel',
    async execute(interaction) {
        await interaction.update({
            components: [
                {
                    type: 17,
                    accent_color: 0xfefdfe,
                    components: [
                        { type: 10, content: '### تم الإلغاء' },
                        { type: 14, divider: true, spacing: 1 },
                        { type: 10, content: 'تم إلغاء عملية إرسال رسالة التعريف.' },
                    ],
                },
            ],
            flags: 32832,
        });
    },
};
