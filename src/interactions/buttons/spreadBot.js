const { safeReply, safeError } = require('@interactions/flow/responder');
const { hasAdminPermission } = require('@auth/permissions');
const { generateInviteUrl } = require('@helpers/inviteUrl');

module.exports = {
    customId: 'spread_bot',
    async execute(interaction) {
        if (!hasAdminPermission(interaction.member)) {
            return safeError(interaction, 'هذا الإجراء يتطلب صلاحيات المسؤول (Administrator).');
        }

        const inviteUrl = generateInviteUrl();

        const components = [
            {
                type: 17,
                accent_color: 0xfefdfe,
                components: [
                    {
                        type: 10,
                        content: '### 🕌 ساعدنا في انتشار البوت',
                    },
                    { type: 14, divider: true, spacing: 1 },
                    {
                        type: 10,
                        content:
                            'يمكنك إرسال رسالة تعريفية بالبوت إلى أي قناة نصية في السيرفر.\n' +
                            '**ماذا سيحدث؟**\n' +
                            'سيتم إرسال رسالة تحتوي على تعريف بالبوت ومميزاته مع زر لإضافته، ' +
                            'بحيث يراها الأعضاء ويمكنهم إضافة البوت لسيرفراتهم الأخرى.\n' +
                            '**معاينة الرسالة التي سيتم إرسالها:**',
                    },
                    { type: 14, divider: true, spacing: 1 },
                    {
                        type: 12,
                        items: [
                            {
                                media: {
                                    url: 'https://cdn.discordapp.com/attachments/1517984597319749803/1517989226451570812/FA34CF8E-E36B-4127-A3E9-B9B138298A2C.png?ex=6a384922&is=6a36f7a2&hm=517a52e11bdffcedbe7611e24700f3b535b197082f63bc3689fd34d9f471fb49',
                                },
                            },
                        ],
                    },
                    { type: 14, divider: true, spacing: 1 },
                    {
                        type: 10,
                        content:
                            '🤍 **ادعُ إلى الخير، وكن سبباً في نشره**\n' +
                            'إذا قام أي شخص بالتعرف على هذا البوت أو إضافته من خلال سيرفرك، فلك وله بإذن الله أجر نشر هذا الخير.\n' +
                            'فمجرد الدلالة على شيء مفيد يمكن أن يكون سبباً في أجر مستمر لك ولغيرك، بطريقة بسيطة ومباشرة.',
                    },
                    { type: 14, divider: true, spacing: 1 },
                    {
                        type: 1,
                        components: [
                            { type: 2, custom_id: 'spread_bot_continue', label: 'متابعة', style: 2 },
                            { type: 2, custom_id: 'spread_bot_cancel', label: 'إلغاء', style: 2 },
                        ],
                    },
                ],
            },
        ];

        await safeReply(interaction, { components, flags: 32832 }, 'spread_bot_info');
    },
};
