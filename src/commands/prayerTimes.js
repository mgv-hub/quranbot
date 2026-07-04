const { wrapInteraction, safeReply } = require('@interactions/flow/responder');
const bootstrap = require('@bot/bootstrap');
const { createStandardEmbed } = require('@ui/embedFactory');

const msg =
    'هذه المعلومات يتم جلبها من https://aladhan.com وقد تختلف عن مواقيت الصلاة الرسمية في بلدك\n' +
    '**نوصي بالتحقق من الموقع الرسمي** للمواعيد الدقيقة: https://alaghan.com/prayer-times';
module.exports = {
    async execute(ix) {
        // wrapInteraction handles defer/reply logic + error boundary — keeps cmd focused on happy path
        await wrapInteraction(
            ix,
            async () => {
                const actionRow = bootstrap?.createPrayerTimesButtonRow?.()?.toJSON?.() ?? {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            custom_id: 'prayer_times',
                            label: 'مواقيت الصلاة',
                            style: 2,
                        },
                    ],
                };

                const components = [
                    {
                        type: 17,
                        accent_color: 0xfefdfe,
                        components: [
                            {
                                type: 10,
                                content: '### مواقيت الصلاة',
                            },
                            {
                                type: 14,
                                divider: true,
                                spacing: 1,
                            },
                            {
                                type: 10,
                                content: 'اختر الدولة ثم المنطقة لعرض مواقيت الصلاة\n**تحذير مهم**\n' + msg,
                            },
                            {
                                type: 14,
                                divider: false,
                                spacing: 2,
                            },
                            {
                                type: 10,
                                content: '**طريقة الاستخدام**\nاضغط على زر مواقيت الصلاة لاختيار الدولة والمنطقة',
                            },
                            {
                                type: 14,
                                divider: true,
                                spacing: 1,
                            },
                            actionRow,
                        ],
                    },
                ];

                await safeReply(
                    ix,
                    {
                        components,
                        flags: 32832,
                    },
                    'prayer_times_cmd',
                );
            },
            { ephemeral: true, label: 'prayer_times_cmd' },
        );
    },
};
