const { wrapInteraction, safeReply } = require('@interactions/flow/responder');
const { createStandardEmbed } = require('@ui/embedFactory');

const msg = [
    {
        title: 'القرآن الكريم والتلاوات',
        value: '[mp3quran.net](https://www.mp3quran.net/ar)\nمصدر رسمي لتلاوات القرآن الكريم بأصوات القراء',
    },
    {
        title: 'مواقيت الصلاة',
        value: '[aladhan.com](https://api.aladhan.com)\nمصدر عالمي لمواقيت الصلاة لجميع الدول والمدن',
    },
    {
        title: 'الأذكار والأدعية',
        value: '[adhkar.json](https://hub-mgv.github.io/QuranBotData/adhkar.json)\nمصدر متخصص لبيانات الأذكار مع الملفات الصوتية',
    },
    {
        title: 'قاعدة البيانات',
        value: 'Firebase Realtime Database\nلتخزين الإعدادات والبيانات بشكل آمن ومستمر',
    },
    {
        title: 'الإذاعات القرآنية',
        value: '[mp3quran.net/radios](https://www.mp3quran.net/ar/radios)\nبث مباشر للإذاعات القرآنية من مختلف الدول',
    },
];

module.exports = {
    async execute(ix) {
        // wrapInteraction handles defer/reply + error boundary — cmd stays focused
        await wrapInteraction(
            ix,
            async () => {
                const sourcesText = msg.map((s) => `### ${s.title}\n${s.value}`).join('\n\n');
                const components = [
                    {
                        type: 17,
                        accent_color: 0xfefdfe,
                        components: [
                            {
                                type: 10,
                                content: '### مصادر معلومات البوت',
                            },
                            {
                                type: 14,
                                divider: true,
                                spacing: 1,
                            },
                            {
                                type: 10,
                                content: 'البوت يستخدم المصادر الرسمية التالية لجلب البيانات',
                            },
                            {
                                type: 14,
                                divider: false,
                                spacing: 2,
                            },
                            {
                                type: 10,
                                content: sourcesText,
                            },
                            {
                                type: 14,
                                divider: true,
                                spacing: 1,
                            },
                            {
                                type: 10,
                                content: '*جميع المصادر رسمية وموثوقة*',
                            },
                        ],
                    },
                ];
                await safeReply(ix, { components, flags: 32832 }, 'sources_cmd');
            },
            { ephemeral: true, label: 'sources_cmd' },
        );
    },
};
