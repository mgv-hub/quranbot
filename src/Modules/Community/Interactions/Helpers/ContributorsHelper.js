function buildContributorsComponents() {
    return [
        {
            type: 17,
            accent_color: 0xfefdfe,
            components: [
                { type: 10, content: '### فريق التطوير والمساهمين' },
                { type: 14, divider: true, spacing: 1 },
                {
                    type: 10,
                    content:
                        'نقدم الشكر لكل من ساهم في تطوير هذا المشروع وجعله متاحاً للجميع:\n\n' +
                        '**المبرمج الأساسي النظام:**\n' +
                        '• <@1379675201616347259> (hub-mgv)\n' +
                        '>  - المطور الرئيسي، إدارة النظام، وتطوير كافة الميزات\n' +
                        '>  - 53 commit | +106,417 -75,664\n\n' +
                        '**شريك مع فريق Cortex HQ:**\n' +
                        '• <@985444871722631199>\n' +
                        '>  - شراكة كاملة مع فريق Cortex HQ\n' +
                        '>  - 3 commits | +424 -268\n\n' +
                        '• <@1492687450844168345>\n' + // 1492687450844168345
                        '>  - اقترح ميزة التذكير بالصلاة، والتي تم تطويرها وإضافتها إلى البوت\n'
                },
                { type: 14, divider: true, spacing: 1 },
                {
                    type: 10,
                    content:
                        '**المشاريع:**\n' +
                        '• المشروع الأصلي: [mgv-hub/quranbot](https://github.com/mgv-hub/quranbot)\n' +
                        '• المشروع الحالي: [cortexhqcore/Cortex-QuranBot](https://github.com/cortexhqcore/Cortex-QuranBot)\n\n' +
                        '*شكراً لدعمكم المستمر لمشروع بوت القرآن الكريم*',
                },
                { type: 14, divider: true, spacing: 1 },
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: 'mgv على GitHub',
                            style: 5,
                            url: 'https://github.com/hub-mgv',
                        },
                        {
                            type: 2,
                            label: 'SEJED-DEV على GitHub',
                            style: 5,
                            url: 'https://github.com/SEJED-DEV',
                        },
                    ],
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: 'المشروع الأصلي',
                            style: 5,
                            url: 'https://github.com/mgv-hub/quranbot',
                        },
                        {
                            type: 2,
                            label: 'المشروع الحالي',
                            style: 5,
                            url: 'https://github.com/cortexhqcore/Cortex-QuranBot',
                        },
                    ],
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            custom_id: 'open_complaint_modal',
                            label: 'تقديم شكوى أو اقتراح',
                            style: 2,
                        },
                    ],
                },
            ],
        },
    ];
}

module.exports.buildContributorsComponents = buildContributorsComponents;
