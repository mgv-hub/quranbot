const { wrapInteraction, safeReply } = require('@interactions/flow/responder');
const { createStandardEmbed } = require('@ui/embedFactory');
const { emoji, gif } = require('@helpers/emojis');

const msg = [
    {
        title: `${emoji.sound} ترقية البث الصوتي إلى Lavalink v4`,
        value: '• نقل معالجة وتشغيل الصوت بالكامل إلى سيرفرات Lavalink الخارجية.\n• خفض استهلاك المعالج (CPU) في السيرفر المحلي إلى **0%** أثناء تشغيل الصوت.\n• حل مشكلة تقطيع وتوقف الصوت نهائياً ودعم أكثر من 150+ بث صوتي متزامن بجودة فائقة.',
    },
    {
        title: `${emoji.electric_bolt} كاش الحالة الموزع عبر Redis`,
        value: '• ترحيل بيانات السيرفرات النشطة من الذاكرة المحلية (Map Cache) إلى كاش **Redis** سريع وآمن.\n• تمكين ميزة التجزئة المتعددة (Stateless Sharding) لتوزيع الأحمال بكفاءة عالية.\n• نظام حماية ذكي (Resilient Fallback) يقوم بالتبديل التلقائي للذاكرة المحلية في حال تعطل Redis لمنع توقف البوت.',
    },
    {
        title: `${emoji.build} إصلاحات وتحسينات شاملة`,
        value: '• إصلاح جميع الأخطاء البرمجية (Reference Errors) المتعلّقة بهيكلة التشغيل الجديدة.\n• تسريع عملية استعادة وتكامل البث الصوتي بعد إعادة التشغيل والتوقف التلقائي.\n• إزالة الشيفرات والتعليقات غير المستخدمة لتحسين أداء قراءة الملفات وسرعة تشغيل البوت.',
    }
];

module.exports = {
    async execute(ix) {
        await wrapInteraction(
            ix,
            async () => {
                const changelogText = msg.map((u) => `### ${u.title}\n${u.value}`).join('\n\n');
                const components = [
                    {
                        type: 17,
                        accent_color: 0xfefdfe,
                        components: [
                            {
                                type: 10,
                                content: `### ${emoji.change} سجل التحديثات والتغييرات الأخيرة`,
                            },
                            {
                                type: 14,
                                divider: true,
                                spacing: 1,
                            },
                            {
                                type: 10,
                                content:
                                    'تم ترقية البنية التحتية للبوت بالكامل لضمان تشغيل مستقر وعلى مدار الساعة لأكثر من 5,000 سيرفر بكفاءة عالية.',
                            },
                            {
                                type: 14,
                                divider: false,
                                spacing: 2,
                            },
                            {
                                type: 10,
                                content: changelogText,
                            },
                            {
                                type: 14,
                                divider: true,
                                spacing: 1,
                            },
                            {
                                type: 10,
                                content: '*Made By mgv-hub*',
                            },
                        ],
                    },
                ];
                await safeReply(ix, { components, flags: 32832 }, 'changelog_cmd');
            },
            { ephemeral: true, label: 'changelog_cmd' },
        );
    },
};
