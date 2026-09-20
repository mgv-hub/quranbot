const { wrapInteraction, safeError } = require('@infrastructure/Discord/Flow/DeferReply');
const { resolveGuildState } = require('@core/Auth/AuthGuard');
const { hasAdminPermission, hasAdminRole, isSpecialUser } = require('@core/Auth/AuthManager');
const { loadPrayerTimesData, getCountries } = require('@data/PrayerTimes/PrayerTimesData');
const { emoji } = require('@shared/Helpers/Emojis');
const prayerReminderManager = require('@modules/Prayer/Reminders/Services/PrayerReminderManager');

module.exports = {
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const member = interaction.member;
                const isAdmin = hasAdminPermission(member) || hasAdminRole(member) || isSpecialUser(interaction.user.id);

                if (!isAdmin) {
                    await safeError(interaction, 'تتطلب هذه العملية امتلاك صلاحيات المسؤول (Administrator)');
                    return;
                }

                const existingReminder = prayerReminderManager.get(interaction.guildId);
                const isEnabled = existingReminder && existingReminder.enabled;
                const isPaused = existingReminder && !existingReminder.enabled;

                let descriptionText = '';
                let buttons = [];

                if (isEnabled) {
                    const prayerNames = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
                    const selectedPrayers = existingReminder.prayers.map((p) => prayerNames[p] || p).join('، ');
                    descriptionText = `**الميزة مفعلة حالياً في هذا السيرفر.**\n**المدينة:** ${existingReminder.cityName}\n**القناة:** <#${existingReminder.channelId}>\n**الصلوات المحددة:** ${selectedPrayers}\n**التوقيت:** قبل الأذان بـ 5 دقائق`;

                    buttons = [
                        { type: 2, custom_id: 'pr_reminder_edit', label: 'تعديل البيانات', style: 2 },
                        { type: 2, custom_id: 'pr_reminder_pause', label: 'تعطيل الميزة مؤقتاً', style: 2 },
                        { type: 2, custom_id: 'pr_reminder_disable', label: 'إيقاف التذكير نهائياً', style: 2 },
                        { type: 2, custom_id: 'pr_reminder_cancel', label: 'إغلاق', style: 2 },
                    ];
                } else if (isPaused) {
                    const prayerNames = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
                    const selectedPrayers = existingReminder.prayers.map((p) => prayerNames[p] || p).join('، ');
                    descriptionText = `**الميزة معطلة مؤقتاً.**\n**المدينة:** ${existingReminder.cityName}\n**القناة:** <#${existingReminder.channelId}>\n**الصلوات المحددة:** ${selectedPrayers}\n**التوقيت:** قبل الأذان بـ 5 دقائق\n\n*اضغط على "إعادة التفعيل" لتشغيل التذكيرات مرة أخرى*`;

                    buttons = [
                        { type: 2, custom_id: 'pr_reminder_resume', label: 'إعادة التفعيل', style: 2 },
                        { type: 2, custom_id: 'pr_reminder_edit', label: 'تعديل البيانات', style: 2 },
                        { type: 2, custom_id: 'pr_reminder_disable', label: 'إيقاف التذكير نهائياً', style: 2 },
                        { type: 2, custom_id: 'pr_reminder_cancel', label: 'إغلاق', style: 2 },
                    ];
                } else {
                    await loadPrayerTimesData();
                    const countries = getCountries();
                    if (!countries || countries.length === 0) {
                        await safeError(interaction, 'بيانات الدول غير متاحة حالياً');
                        return;
                    }
                    descriptionText = `هذه الميزة تتيح لك إعداد تذكيرات تلقائية لأوقات الصلاة في سيرفرك.\nسيقوم البوت بإرسال رسالة تنبيهية قبل الأذان بـ 5 دقائق في القناة التي تحددها.\n**لبدء الإعداد، اضغط على الزر أدناه.**`;
                    buttons = [
                        { type: 2, custom_id: 'pr_reminder_start', label: 'بدء الإعداد', style: 2 },
                        { type: 2, custom_id: 'pr_reminder_cancel', label: 'إلغاء', style: 2 },
                    ];
                }

                const components = [
                    {
                        type: 17,
                        accent_color: 0xfefdfe,
                        components: [
                            { type: 10, content: `### ${emoji.prayer_times} تذكير بالصلاة` },
                            { type: 14, divider: true, spacing: 1 },
                            { type: 10, content: descriptionText },
                            { type: 14, divider: false, spacing: 2 },
                            {
                                type: 1,
                                components: buttons,
                            },
                        ],
                    },
                ];

                await interaction.editReply({ components, flags: 32832 });
            },
            { context: { label: 'prayer_reminder_command' } },
        );
    },
};
