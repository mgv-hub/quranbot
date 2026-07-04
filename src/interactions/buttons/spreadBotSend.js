const { PermissionsBitField } = require('discord.js');
const logger = require('@logging/logger');
const { emoji } = require('@helpers/emojis');
const { generateInviteUrl } = require('@helpers/inviteUrl');

module.exports = {
    customId: 'spread_bot_send',

    async execute(interaction) {
        const channelId = interaction.customId.replace('spread_bot_send_', '');
        const channel = interaction.guild.channels.cache.get(channelId);
        if (!channel) {
            return interaction.update({
                components: [
                    {
                        type: 17,
                        accent_color: 0xfefdfe,
                        components: [
                            { type: 10, content: '### تعذّر الإرسال' },
                            { type: 14, divider: true, spacing: 1 },
                            { type: 10, content: 'لم يتم العثور على القناة المحددة. ربما تم حذفها.' },
                        ],
                    },
                ],
                flags: 32832,
            });
        }

        const botMember = interaction.guild.members.me;
        const channelPerms = channel.permissionsFor(botMember);

        if (!channelPerms.has(PermissionsBitField.Flags.SendMessages)) {
            return interaction.update({
                components: [
                    {
                        type: 17,
                        accent_color: 0xfefdfe,
                        components: [
                            { type: 10, content: '### صلاحيات غير كافية' },
                            { type: 14, divider: true, spacing: 1 },
                            { type: 10, content: `البوت لا يملك صلاحية إرسال الرسائل في <#${channelId}>.` },
                        ],
                    },
                ],
                flags: 32832,
            });
        }
        const inviteUrl = generateInviteUrl();

        const adContainer = {
            type: 17,
            accent_color: 0xfefdfe,
            components: [
                {
                    type: 10,
                    content: '### 🕌 بوت القرآن الكريم',
                },
                { type: 14, divider: true, spacing: 1 },
                {
                    type: 10,
                    content:
                        'بث قرآني مستمر بجودة عالية مع دعم أكثر من **150 قارئ**\n' +
                        'إذاعات قرآنية مباشرة على مدار الساعة\n' +
                        'مواقيت صلاة دقيقة لجميع المناطق\n' +
                        'أذكار وتنبيهات تفاعلية\n' +
                        'لوحة تحكم سهلة لإدارة التشغيل',
                },
                { type: 14, divider: true, spacing: 1 },
                {
                    type: 10,
                    content:
                        '**للبدء سريعًا:**\n' +
                        '`/إعداد` — تجهيز القنوات تلقائيًا\n' +
                        '`/دخول` — تشغيل البوت داخل الروم الصوتي\n' +
                        '`/تحكم` — فتح لوحة التحكم\n' +
                        '`/دليل` — عرض جميع الأوامر',
                },
                { type: 14, divider: true, spacing: 1 },
                {
                    type: 1,
                    components: [{ type: 2, label: 'إضافة البوت', style: 5, url: inviteUrl }],
                },
                {
                    type: 10,
                    content: `> by ${interaction.user}`,
                },
                {
                    type: 10,
                    content: emoji.horizontal.repeat(29),
                },
                { type: 14, divider: true, spacing: 1 },
            ],
        };

        try {
            await channel.send({ components: [adContainer], flags: 32768 });
        } catch (err) {
            logger.error('spread_bot send failed', { channelId, error: err.message || String(err) });
            return interaction.update({
                components: [
                    {
                        type: 17,
                        accent_color: 0xfefdfe,
                        components: [
                            { type: 10, content: '### فشل الإرسال' },
                            { type: 14, divider: true, spacing: 1 },
                            { type: 10, content: 'حدث خطأ أثناء إرسال الرسالة. تأكد من صلاحيات البوت في القناة.' },
                        ],
                    },
                ],
                flags: 32832,
            });
        }
        await interaction.update({
            components: [
                {
                    type: 17,
                    accent_color: 0xfefdfe,
                    components: [
                        { type: 10, content: '### تم الإرسال بنجاح' },
                        { type: 14, divider: true, spacing: 1 },
                        { type: 10, content: `تم إرسال رسالة التعريف بالبوت إلى <#${channelId}>.` },
                    ],
                },
            ],
            flags: 32832,
        });
    },
};
