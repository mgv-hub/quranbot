const { emoji, gif } = require('@helpers/emojis');

const wrapContainer = (components, accentColor = 0xfefdfe) => [
    {
        type: 17,
        accent_color: accentColor,
        components,
    },
];

const buildPromptV2 = (promptText, targetChannelId) =>
    wrapContainer([
        { type: 10, content: `### ${emoji.headphones} نظام الانضمام للقنوات الصوتية` },
        { type: 14, divider: true, spacing: 1 },
        { type: 10, content: promptText },
        { type: 14, divider: false, spacing: 2 },
        {
            type: 10,
            content: `${emoji.bulb___} **للحصول على تجربة كاملة:**\nيمكنك استخدام أمر **/إعداد** لإنشاء فئة متكاملة تحتوي على غرفة التحكم، قناة الأذكار، والروم الصوتي بشكل منظم.`,
        },
        { type: 14, divider: true, spacing: 1 },
        {
            type: 1,
            components: [
                { type: 2, custom_id: `save_join_channel_${targetChannelId}`, label: 'حفظ القناة', style: 2 },
                { type: 2, custom_id: `temp_join_channel_${targetChannelId}`, label: 'مؤقت فقط', style: 2 },
            ],
        },
    ]);

const buildLoadingV2 = (channelId) =>
    wrapContainer([
        { type: 10, content: `### ${emoji.timer} جاري معالجة الطلب...` },
        { type: 14, divider: true, spacing: 1 },
        { type: 10, content: 'يرجى الانتظار، يتم الانضمام إلى القناة الصوتية حالياً.' },
        { type: 14, divider: true, spacing: 1 },
        {
            type: 1,
            components: [
                { type: 2, custom_id: `save_join_channel_${channelId}`, label: 'حفظ القناة', style: 2, disabled: true },
                { type: 2, custom_id: `temp_join_channel_${channelId}`, label: 'مؤقت فقط', style: 2, disabled: true },
            ],
        },
    ]);

const buildErrorV2 = (title, desc) =>
    wrapContainer([
        { type: 10, content: `### ${emoji.exclamation} ${title}` },
        { type: 14, divider: true, spacing: 1 },
        { type: 10, content: desc },
    ]);

const buildSuccessV2 = (isSave, channelId) => {
    const title = isSave ? `${emoji.check} تم الحفظ والانضمام بنجاح` : `${emoji.check} تم الانضمام المؤقت`;
    const desc = isSave
        ? `تم حفظ قناة <#${channelId}> كقناة افتراضية للبوت، وسيتم استخدامها تلقائياً في المرات القادمة.`
        : `تم الانضمام إلى قناة <#${channelId}> بشكل مؤقت فقط.`;

    return wrapContainer([
        { type: 10, content: `### ${title}` },
        { type: 14, divider: true, spacing: 1 },
        { type: 10, content: desc },
        { type: 14, divider: false, spacing: 2 },
        {
            type: 10,
            content: `${emoji.bulb___} **للحصول على تجربة كاملة:**\nيمكنك استخدام أمر **/إعداد** لإنشاء فئة متكاملة تحتوي على غرفة التحكم، قناة الأذكار، والروم الصوتي بشكل منظم.`,
        },
        { type: 14, divider: true, spacing: 1 },
    ]);
};

module.exports = {
    buildPromptV2,
    buildLoadingV2,
    buildErrorV2,
    buildSuccessV2,
};
