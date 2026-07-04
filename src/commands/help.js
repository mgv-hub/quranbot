const { wrapInteraction, safeReply } = require('@interactions/flow/responder');
const { createStandardEmbed } = require('@ui/embedFactory');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { emoji, gif } = require('@helpers/emojis');

const link = {
    website: 'https://mgv-hub.github.io/quranbot/',
    github: 'https://github.com/mgv-hub/quranbot',
    support: 'https://discord.gg/DwtAPzrbZS',
    invite: 'https://discord.com/oauth2/authorize?client_id=1436018817988825138&permissions=8&integration_type=0&scope=bot+applications.commands',
    privacy: 'https://mgv-hub.github.io/quranbot/privacy.html',
    terms: 'https://mgv-hub.github.io/quranbot/terms.html',
    topgg: 'https://top.gg/bot/1436018817988825138',
};

module.exports = {
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const components = [
                    {
                        type: 17,
                        accent_color: 0xfefdfe,
                        components: [
                            {
                                type: 10,
                                content: `### ${emoji.link} روابط البوت`,
                            },
                            {
                                type: 14,
                                divider: true,
                                spacing: 1,
                            },
                            {
                                type: 10,
                                content: 'جميع الروابط الرسمية المتعلقة ببوت القرآن الكريم',
                            },
                            {
                                type: 14,
                                divider: false,
                                spacing: 2,
                            },
                            {
                                type: 10,
                                content: `${emoji.globe} **الموقع الرسمي**\n[زيارة الموقع](${link.website})\n\n${emoji.chat} **سيرفر الدعم**\n[انضم الآن](${link.support})\n\n${emoji.chat} **إضافة البوت**\n[دعوة البوت](${link.invite})\n\n${emoji.code} **كود المصدر**\n[GitHub](${link.github})\n\n${emoji.globe} **Top.gg**\n[تصويت ودعم](${link.topgg})\n\n${emoji.globe} **سياسة الخصوصية**\n[اقرأ المزيد](${link.privacy})\n\n**شروط الخدمة**\n[اقرأ المزيد](${link.terms})`,
                            },
                            {
                                type: 14,
                                divider: true,
                                spacing: 1,
                            },
                            {
                                type: 10,
                                content: `${emoji.book} **دليل الاستخدام**\nاستخدم الأمر **/دليل** لعرض جميع أوامر البوت مع شرح كل أمر بالتفصيل`,
                            },
                            {
                                type: 14,
                                divider: true,
                                spacing: 1,
                            },
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 2,
                                        label: 'الموقع',
                                        style: 5,
                                        url: link.website,
                                    },
                                    {
                                        type: 2,
                                        label: 'الدعم',
                                        style: 5,
                                        url: link.support,
                                    },
                                    {
                                        type: 2,
                                        label: 'GitHub',
                                        style: 5,
                                        url: link.github,
                                    },
                                    {
                                        type: 2,
                                        label: 'دعوة البوت',
                                        style: 5,
                                        url: link.invite,
                                    },
                                ],
                            },
                        ],
                    },
                ];
                await safeReply(interaction, { components, flags: 32832 }, 'help_command');
            },
            { ephemeral: true, label: 'help_command' },
        );
    },
};
