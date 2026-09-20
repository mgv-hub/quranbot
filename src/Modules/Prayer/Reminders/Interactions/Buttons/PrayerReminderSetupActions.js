const { emoji } = require('@shared/Helpers/Emojis');
const prayerReminderManager = require('@modules/Prayer/Reminders/Services/PrayerReminderManager');
const { getCountries } = require('@data/PrayerTimes/PrayerTimesData');
const { clearSession } = require('@modules/Prayer/Reminders/Helpers/PrayerReminderSession');
const { buildCountrySelect } = require('@modules/Prayer/Reminders/Helpers/PrayerReminderUI');

async function handleStart(interaction) {
    const countries = getCountries();
    await interaction.editReply({ components: [buildCountrySelect(countries)], flags: 32832 });
}

async function handleDisable(guildId, interaction) {
    await prayerReminderManager.remove(guildId);
    await interaction.editReply({
        components: [
            {
                type: 17,
                accent_color: 0xfefdfe,
                components: [
                    { type: 10, content: `### ${emoji.close} تم إيقاف التذكير نهائياً` },
                    { type: 14, divider: true, spacing: 1 },
                    { type: 10, content: 'تم إيقاف تذكيرات الصلاة وحذف جميع الإعدادات من قاعدة البيانات.' },
                ],
            },
        ],
        flags: 32832,
    });
}

async function handlePause(guildId, interaction) {
    await prayerReminderManager.pause(guildId);
    const { calculateDailyJobs } = require('@modules/Prayer/Reminders/Services/PrayerReminderSchedulerModule');
    await calculateDailyJobs();
    await interaction.editReply({
        components: [
            {
                type: 17,
                accent_color: 0xfefdfe,
                components: [
                    { type: 10, content: `### ${emoji.pause} تم تعطيل الميزة مؤقتاً` },
                    { type: 14, divider: true, spacing: 1 },
                    { type: 10, content: 'تم تعطيل تذكيرات الصلاة مؤقتاً. البيانات محفوظة ويمكنك إعادة التفعيل في أي وقت.' },
                ],
            },
        ],
        flags: 32832,
    });
}

async function handleResume(guildId, interaction) {
    await prayerReminderManager.resume(guildId);
    const { calculateDailyJobs } = require('@modules/Prayer/Reminders/Services/PrayerReminderSchedulerModule');
    await calculateDailyJobs();
    await interaction.editReply({
        components: [
            {
                type: 17,
                accent_color: 0xfefdfe,
                components: [
                    { type: 10, content: `### ${emoji.check} تم إعادة التفعيل` },
                    { type: 14, divider: true, spacing: 1 },
                    { type: 10, content: 'تم إعادة تفعيل تذكيرات الصلاة بنجاح.' },
                ],
            },
        ],
        flags: 32832,
    });
}

async function handleCancel(guildId, interaction) {
    clearSession(guildId);
    await interaction.editReply({
        components: [
            {
                type: 17,
                accent_color: 0xfefdfe,
                components: [
                    { type: 10, content: `### ${emoji.close} تم الإلغاء` },
                    { type: 14, divider: true, spacing: 1 },
                    { type: 10, content: 'تم إلغاء عملية إعداد التذكير.' },
                ],
            },
        ],
        flags: 32832,
    });
}

module.exports.handleStart = handleStart;
module.exports.handleDisable = handleDisable;
module.exports.handlePause = handlePause;
module.exports.handleResume = handleResume;
module.exports.handleCancel = handleCancel;
