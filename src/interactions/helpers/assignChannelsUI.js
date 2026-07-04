const { emoji } = require('@helpers/emojis');

function wrapContainer(components) {
    return [{ type: 17, accent_color: 0xfefdfe, components }];
}

function formatChannelName(client, id) {
    if (!id) return 'غير محدد';
    const ch = client.channels.cache.get(id);
    return ch ? `<#${id}>` : `\`${id}\` (محذوف/غير موجود)`;
}

function buildInitMessage(before) {
    return wrapContainer([
        { type: 10, content: `### ${emoji.settings} تعيين القنوات` },
        { type: 14, divider: true, spacing: 1 },
        {
            type: 10,
            content: `**القنوات الحالية المحفوظة:**
${emoji.group} الفئة: ${formatChannelName(global.client, before.categoryId)}
${emoji.chat} التحكم: ${formatChannelName(global.client, before.textId)}
${emoji.crescent_moon} الأذكار: ${formatChannelName(global.client, before.azkarId)}
${emoji.headphones} الصوتي: ${formatChannelName(global.client, before.voiceId)}`,
        },
        { type: 14, divider: false, spacing: 2 },
        {
            type: 10,
            content: `**تعيين القنوات المتقدمة**
هذه الأداة تتيح لك:
• **نقل القنوات:** تغيير القنوات الافتراضية ونقل البوت إلى قنوات أخرى موجودة.
• **استعادة القنوات:** إصلاح القنوات التي تم حذفها أو تعديل معرفاتها (IDs) يدوياً.
• **إعادة الهيكلة:** تحديث مسارات الفئة والتحكم والأذكار دون إعادة الإعداد من الصفر.`,
        },
        { type: 14, divider: true, spacing: 1 },
        { type: 1, components: [{ type: 2, custom_id: 'assign_start', label: 'بدء التعيين', style: 2 }] },
    ]);
}

function buildCategorySelect() {
    return wrapContainer([
        { type: 10, content: `### ${emoji.group} الخطوة 1: اختيار الفئة` },
        { type: 14, divider: true, spacing: 1 },
        { type: 10, content: 'يرجى اختيار فئة (Category) البوت الرئيسية.' },
        { type: 14, divider: true, spacing: 1 },
        {
            type: 1,
            components: [
                {
                    type: 8,
                    custom_id: 'assign_select_category',
                    placeholder: 'اختر الفئة',
                    channel_types: [4],
                    min_values: 1,
                    max_values: 1,
                },
            ],
        },
    ]);
}

function buildTextSelect() {
    return wrapContainer([
        { type: 10, content: `### ${emoji.chat} الخطوة 2: اختيار قناة التحكم` },
        { type: 14, divider: true, spacing: 1 },
        { type: 10, content: 'يرجى اختيار القناة النصية للوحة التحكم.' },
        { type: 14, divider: true, spacing: 1 },

        {
            type: 1,
            components: [
                {
                    type: 8,
                    custom_id: 'assign_select_text',
                    placeholder: 'اختر قناة التحكم',
                    channel_types: [0, 5],
                    min_values: 1,
                    max_values: 1,
                },
            ],
        },
    ]);
}

function buildAzkarSelect() {
    return wrapContainer([
        { type: 10, content: `### ${emoji.crescent_moon} الخطوة 3: اختيار قناة الأذكار` },
        { type: 14, divider: true, spacing: 1 },
        { type: 10, content: 'يرجى اختيار القناة النصية للأذكار.' },
        { type: 14, divider: true, spacing: 1 },
        {
            type: 1,
            components: [
                {
                    type: 8,
                    custom_id: 'assign_select_azkar',
                    placeholder: 'اختر قناة الأذكار',
                    channel_types: [0, 5],
                    min_values: 1,
                    max_values: 1,
                },
            ],
        },
    ]);
}

function buildVoiceSelect() {
    return wrapContainer([
        { type: 10, content: `### ${emoji.headphones} الخطوة 4: اختيار الروم الصوتي` },
        { type: 14, divider: true, spacing: 1 },
        { type: 10, content: 'يرجى اختيار الغرفة الصوتية للبث.' },
        { type: 14, divider: true, spacing: 1 },
        {
            type: 1,
            components: [
                {
                    type: 8,
                    custom_id: 'assign_select_voice',
                    placeholder: 'اختر الروم الصوتي',
                    channel_types: [2],
                    min_values: 1,
                    max_values: 1,
                },
            ],
        },
    ]);
}

function buildReviewMessage(before, after) {
    return wrapContainer([
        { type: 10, content: `### ${emoji.edit} مراجعة التعيينات` },
        { type: 14, divider: true, spacing: 1 },
        {
            type: 10,
            content: `**قبل التعيين:**
${emoji.group} الفئة: ${formatChannelName(global.client, before.categoryId)}
${emoji.chat} التحكم: ${formatChannelName(global.client, before.textId)}
${emoji.crescent_moon} الأذكار: ${formatChannelName(global.client, before.azkarId)}
${emoji.headphones} الصوتي: ${formatChannelName(global.client, before.voiceId)}`,
        },
        { type: 14, divider: false, spacing: 2 },

        {
            type: 10,
            content: `**بعد التعيين:**
${emoji.group} الفئة: ${formatChannelName(global.client, after.categoryId)}
${emoji.chat} التحكم: ${formatChannelName(global.client, after.textId)}
${emoji.crescent_moon} الأذكار: ${formatChannelName(global.client, after.azkarId)}
${emoji.headphones} الصوتي: ${formatChannelName(global.client, after.voiceId)}`,
        },
        { type: 14, divider: true, spacing: 1 },
        { type: 1, components: [{ type: 2, custom_id: 'assign_save', label: 'تأكيد الحفظ', style: 2 }] },
    ]);
}

function buildSuccessMessage() {
    return wrapContainer([
        { type: 10, content: `### ${emoji.check} تم التعيين بنجاح` },
        { type: 14, divider: true, spacing: 1 },
        { type: 10, content: 'تم تعيين القنوات الجديدة بنجاح وتحديث لوحة التحكم والأذكار.' },
    ]);
}

module.exports = {
    wrapContainer,
    formatChannelName,
    buildInitMessage,
    buildCategorySelect,
    buildTextSelect,
    buildAzkarSelect,
    buildVoiceSelect,
    buildReviewMessage,
    buildSuccessMessage,
};
