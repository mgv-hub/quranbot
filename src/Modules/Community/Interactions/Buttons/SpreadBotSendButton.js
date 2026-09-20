const path = require('path');
const { PermissionsBitField, AttachmentBuilder } = require('discord.js');
const logger = require('@infrastructure/Logging/Logger');
const { emoji } = require('@shared/Helpers/Emojis');
const { generateInviteUrl } = require('@shared/Helpers/InviteUrl');

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
        const bannerName = 'banner.webp';
        const bannerPath = path.resolve(__dirname, '../../../../img', bannerName);

        const banner = new AttachmentBuilder(bannerPath, {
            name: bannerName,
        });

        const adContainer = {
            type: 17,
            accent_color: 0xfefdfe,
            components: [
                {
                    type: 12,
                    items: [
                        {
                            media: {
                                url: `attachment://${bannerName}`,
                            },
                        },
                    ],
                },
                {
                    type: 10,
                    content: '### 🕌 بوت القرآن الكريم',
                },
                {
                    type: 10,
                    content:
                        'اجعل سيرفرك أقرب إلى القرآن والذكر مع بوت إسلامي متكامل يجمع بين **القرآن الكريم، التلاوات، التفاسير، الأذكار، مواقيت الصلاة والتنبيهات** في تجربة واحدة سهلة وسريعة داخل Discord.',
                },
                { type: 14, divider: true, spacing: 1 },
                {
                    type: 10,
                    content:
                        '### القرآن الكريم\n' +
                        '• تشغيل سور القرآن الكريم صوتيًا داخل القنوات الصوتية\n' +
                        '• الاستماع إلى السور مع أكثر من **150 قارئًا**\n' +
                        '• اختيار السورة والقارئ بسهولة\n' +
                        '• البحث عن الكلمات والآيات داخل القرآن\n' +
                        '• عرض السور والآيات بطريقة سهلة داخل Discord',
                },
                {
                    type: 10,
                    content:
                        '### التفاسير والبحث\n' +
                        '• عرض **تفسير الآيات** مباشرة\n' +
                        '• اختيار السورة ثم الآية للوصول إلى التفسير\n' +
                        '• البحث عن كلمة داخل القرآن والوصول إلى مواضعها\n' +
                        '• تصفح الآيات والتنقل بينها بسهولة',
                },
                {
                    type: 10,
                    content:
                        '### الإذاعات القرآنية\n' +
                        'استمع إلى **إذاعات قرآنية مباشرة على مدار الساعة** مع مجموعة كبيرة من المحطات والتلاوات، لتستمر التلاوة في سيرفرك دون الحاجة إلى تشغيلها يدويًا كل مرة.',
                },
                { type: 14, divider: true, spacing: 1 },
                {
                    type: 10,
                    content:
                        '### مواقيت الصلاة\n' +
                        '• حساب وعرض **مواقيت الصلاة** حسب موقعك\n' +
                        '• دعم عدد كبير من الدول والمدن والمناطق\n' +
                        '• اختيار الدولة والمدينة بسهولة\n' +
                        '• عرض أوقات الفجر والظهر والعصر والمغرب والعشاء',
                },
                {
                    type: 10,
                    content:
                        '### تذكير بالصلوات\n' +
                        'فعّل **تنبيهات الصلاة** في سيرفرك ليتم تذكير الأعضاء بدخول وقت الصلاة بشكل تلقائي، مع إمكانية إعداد القناة والأدوار والإشعارات بما يناسب السيرفر.',
                },
                {
                    type: 10,
                    content:
                        '### الأذكار\n' +
                        '• أذكار متنوعة داخل Discord\n' +
                        '• إرسال الأذكار بشكل تلقائي ودوري\n' +
                        '• إعدادات خاصة بالأذكار والقنوات والأدوار\n' +
                        '• دعم تشغيل الأذكار صوتيًا',
                },
                {
                    type: 10,
                    content:
                        '### التسبيح\n' +
                        'استخدم **عداد التسبيح التفاعلي** داخل Discord وسجّل تسبيحاتك بسهولة من خلال واجهة تفاعلية بسيطة.',
                },
                { type: 14, divider: true, spacing: 1 },
                {
                    type: 10,
                    content:
                        '### تجربة صوتية متكاملة\n' +
                        '• تشغيل القرآن والتلاوات داخل القنوات الصوتية\n' +
                        '• أكثر من **150 قارئًا**\n' +
                        '• إذاعات قرآنية مباشرة\n' +
                        '• تحكم في التشغيل والإيقاف والتنقل\n' +
                        '• نظام صوتي مصمم للاستقرار والاستمرارية',
                },
                {
                    type: 10,
                    content:
                        '### أدوات وإدارة السيرفر\n' +
                        '• إعداد تلقائي للقنوات المطلوبة\n' +
                        '• تخصيص قنوات القرآن والصوت والتنبيهات\n' +
                        '• نظام إعدادات متكامل لكل سيرفر\n' +
                        '• لوحة تحكم للتحكم في البوت\n' +
                        '• دليل شامل للأوامر والميزات\n' +
                        '• نظام إشعارات وأدوار للتنبيهات',
                },
                { type: 14, divider: true, spacing: 1 },
                {
                    type: 10,
                    content:
                        '### أداء واستقرار\n' +
                        'نعمل على توفير تجربة سريعة ومستقرة مع بنية تحتية موزعة جغرافيًا لتقليل التأخير وتحسين جودة الاتصال الصوتي للمستخدمين في مختلف المناطق.',
                },
                {
                    type: 10,
                    content:
                        '🇫🇷 **أوروبا — باريس، فرنسا (2 سيرفرات)**\n' +
                        '🇩🇪 **أوروبا — فرانكفورت، ألمانيا (1 سيرفر)**\n' +
                        '🇺🇸 **أمريكا الشمالية — سان فرانسيسكو، فيرجينيا، ميامي، أشبورن، الولايات المتحدة (4 سيرفرات)**\n' +
                        '🇨🇦 **أمريكا الشمالية — كيبيك، كندا (1 سيرفر)**\n' +
                        '🇲🇽 **أمريكا الشمالية — سانتياغو دي كويريتارو، المكسيك (1 سيرفر)**\n' +
                        '🇧🇷 **أمريكا الجنوبية — ساو باولو، البرازيل (1 سيرفر)**\n' +
                        '🇮🇳 **آسيا — ماهاراشترا، الهند (1 سيرفر)**\n' +
                        '🇸🇬 **آسيا — سنغافورة (1 سيرفر)**\n' +
                        '🇦🇪 **الشرق الأوسط — دبي، الإمارات (1 سيرفر)**\n' +
                        '🇦🇺 **أوقيانوسيا — سيدني، أستراليا (1 سيرفر)**',
                },
                { type: 14, divider: true, spacing: 1 },
                {
                    type: 10,
                    content:
                        '### ابدأ خلال ثوانٍ\n' +
                        '`/إعداد` — إعداد البوت والقنوات تلقائيًا\n' +
                        '`/دخول` — تشغيل البوت داخل القناة الصوتية\n' +
                        '`/تحكم` — فتح لوحة التحكم\n' +
                        '`/دليل` — استعراض جميع الأوامر والميزات\n' +
                        '`/مواقيت-الصلاة` — عرض مواقيت الصلاة\n' +
                        '`/تفسير` — الوصول إلى تفسير الآيات\n' +
                        '`/بحث` — البحث داخل القرآن',
                },
                { type: 14, divider: true, spacing: 1 },
                {
                    type: 10,
                    content: '### موثق من Discord\n' + 'هذا البوت موثق رسميًا من Discord.',
                },
                { type: 14, divider: true, spacing: 1 },
                {
                    type: 10,
                    content:
                        '### كل ما تحتاجه في بوت واحد\n' +
                        '**القرآن الكريم • أكثر من 150 قارئًا • الإذاعات القرآنية • التفاسير • البحث في القرآن • مواقيت الصلاة • تذكير الصلوات • الأذكار • أذكار صوتية • التسبيح • إدارة القنوات • التنبيهات • لوحة التحكم**',
                },
                {
                    type: 1,
                    components: [
                        { type: 2, label: 'إضافة البوت', style: 5, url: inviteUrl },
                        { type: 2, custom_id: 'show_contributors', label: 'المساهمين', style: 2 },
                    ],
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
            await channel.send({
                files: [banner],
                components: [adContainer],
                flags: 32768,
            });
        } catch (err) {
            logger.error('spread_bot send failed', err, { channelId });
            return interaction.update({
                components: [
                    {
                        type: 17,
                        accent_color: 0xfefdfe,
                        components: [
                            { type: 10, content: '### فشل الإرسال' },
                            { type: 14, divider: true, spacing: 1 },
                            { type: 10, content: 'حدث خطأ أثناء إرسال الرسالة. تأكد من صلاحيات البوت في القناة ومن وجود صورة البانر.' },
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

module.exports.customId = 'spread_bot_send';
module.exports.execute = module.exports.execute;
