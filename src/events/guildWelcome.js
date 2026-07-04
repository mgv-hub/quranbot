const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('@logging/logger');
const { emoji } = require('@helpers/emojis');

async function resolveChannel(guild) {
    if (
        guild.systemChannel &&
        guild.systemChannel.isTextBased() &&
        guild.systemChannel.permissionsFor(guild.members.me)?.has('SendMessages')
    ) {
        return guild.systemChannel;
    }

    const cached = guild.channels.cache.find(
        (channel) => channel.isTextBased() && channel.permissionsFor(guild.members.me)?.has('SendMessages'),
    );

    if (cached) return cached;

    const fetched = await guild.channels.fetch();
    return fetched.find((channel) => channel?.isTextBased() && channel.permissionsFor(guild.members.me)?.has('SendMessages'));
}

async function sendWelcome(guild) {
    const channel = await resolveChannel(guild);

    if (!channel) {
        logger.warn(`No writable channel found in ${guild.name} (${guild.id})`);
        return;
    }

    const components = [
        {
            type: 17,
            accent_color: 0xfefdfe,
            components: [
                {
                    type: 10,
                    content: `### ${emoji.welcome} أهلاً بك في بوت القرآن الكريم`,
                },
                {
                    type: 14,
                    divider: true,
                    spacing: 1,
                },
                {
                    type: 10,
                    content: 'مرحبًا بك، وشكرًا لإضافة البوت إلى سيرفرك.',
                },
                {
                    type: 14,
                    divider: false,
                    spacing: 2,
                },
                {
                    type: 10,
                    content:
                        `${emoji.features} **ماذا يوفر البوت؟**\n\n` +
                        `${emoji.book} بث قرآني مستمر بجودة عالية مع دعم أكثر من 150 قارئ\n` +
                        `${emoji.radio} إذاعات قرآنية مباشرة على مدار الساعة\n` +
                        `${emoji.prayer_times} مواقيت صلاة دقيقة لجميع المناطق\n` +
                        `${emoji.crescent_moon} أذكار وتنبيهات تفاعلية\n` +
                        `لوحة تحكم سهلة لإدارة التشغيل`,
                },
                {
                    type: 14,
                    divider: true,
                    spacing: 1,
                },
                {
                    type: 10,
                    content:
                        `${emoji.edit} **للبدء سريعًا**\n\n` +
                        '`/إعداد` — تجهيز القنوات تلقائيًا\n' +
                        '`/دخول` — تشغيل البوت داخل الروم الصوتي\n' +
                        '`/تحكم` — فتح لوحة التحكم\n' +
                        '`/دليل` — عرض جميع الأوامر`',
                },
                {
                    type: 14,
                    divider: false,
                    spacing: 2,
                },
                {
                    type: 10,
                    content: 'يعتمد البوت على بنية صوتية مستقرة لضمان تشغيل متواصل بدون انقطاع.',
                },
                {
                    type: 14,
                    divider: true,
                    spacing: 1,
                },
                {
                    type: 10,
                    content: 'Made by mgv-hub',
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
                            label: 'سيرفر الدعم',
                            style: 5,
                            url: 'https://discord.gg/DwtAPzrbZS',
                        },
                        {
                            type: 2,
                            label: 'GitHub',
                            style: 5,
                            url: 'https://github.com/mgv-hub/quranbot',
                        },
                    ],
                },
            ],
        },
    ];

    await channel.send({ components, flags: 32768 });
}

module.exports = {
    sendWelcome,
};
