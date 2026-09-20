const path = require('path');
const { AttachmentBuilder } = require('discord.js');
const { safeReply, safeError } = require('@infrastructure/Discord/Flow/Responder');
const { hasAdminPermission } = require('@core/Auth/Permissions');
const { generateInviteUrl } = require('@shared/Helpers/InviteUrl');

module.exports = {
    customId: 'spread_bot',
    async execute(interaction) {
        if (!hasAdminPermission(interaction.member)) {
            return safeError(interaction, 'هذا الإجراء يتطلب صلاحيات المسؤول (Administrator).');
        }

        const inviteUrl = generateInviteUrl();

        const imageName = 'spreadBot.png';
        const imagePath = path.resolve(__dirname, '../../../../img', imageName);

        const image = new AttachmentBuilder(imagePath, {
            name: imageName,
        });

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
                                    url: `attachment://${imageName}`,
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

        await safeReply(interaction, { components, files: [image], flags: 32832 }, 'spread_bot_info');
    },
};
