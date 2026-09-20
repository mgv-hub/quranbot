const { ChannelType } = require('discord.js');
const { emoji } = require('@shared/Helpers/Emojis');
const { safeError } = require('@infrastructure/Discord/Flow/DeferReply');
const { getCountries, getCitiesForCountry } = require('@data/PrayerTimes/PrayerTimesData');
const prayerReminderManager = require('@modules/Prayer/Reminders/Services/PrayerReminderManager');
const { channel_names } = require('@config/Constants');
const { clearSession } = require('@modules/Prayer/Reminders/Helpers/PrayerReminderSession');
const {
    buildCountrySelect,
    buildCitySelect,
    buildPrayerSelect,
    buildChannelPrompt,
    buildRoleSelect,
    buildEditMenu,
} = require('@modules/Prayer/Reminders/Helpers/PrayerReminderUI');
const { saveReminder } = require('@modules/Prayer/Reminders/Helpers/PrayerReminderActions');

async function handleEditStart(guildId, session, interaction) {
    const existingReminder = prayerReminderManager.get(guildId);
    if (!existingReminder) {
        return safeError(interaction, 'لا توجد بيانات تذكير للتعديل');
    }

    session.isEdit = true;
    session.countryCode = existingReminder.countryCode;
    session.countryName = existingReminder.countryName;
    session.cityName = existingReminder.cityName;
    session.lat = existingReminder.lat;
    session.lng = existingReminder.lng;
    session.method = existingReminder.method;
    session.prayers = [...existingReminder.prayers];
    session.channelId = existingReminder.channelId;
    session.roles = [...(existingReminder.roles || [])];
    session.mentionEveryone = existingReminder.mentionEveryone || false;
    session.mentionHere = existingReminder.mentionHere || false;

    await interaction.editReply({ components: [buildEditMenu(session)], flags: 32832 });
}

async function handleEditCountry(session, interaction) {
    const countries = getCountries();
    await interaction.editReply({ components: [buildCountrySelect(countries)], flags: 32832 });
}

async function handleEditCity(session, interaction) {
    const cities = getCitiesForCountry(session.countryCode);
    await interaction.editReply({ components: [buildCitySelect(cities, session.countryCode)], flags: 32832 });
}

async function handleEditPrayers(session, interaction) {
    await interaction.editReply({ components: [buildPrayerSelect()], flags: 32832 });
}

async function handleEditChannel(session, interaction) {
    const guild = interaction.guild;
    const hasCategory = guild.channels.cache.some((c) => c.name === channel_names.category && c.type === ChannelType.GuildCategory);
    await interaction.editReply({ components: [buildChannelPrompt(session, hasCategory)], flags: 32832 });
}

async function handleEditRoles(session, interaction) {
    await interaction.editReply({ components: [buildRoleSelect(session)], flags: 32832 });
}

async function handleEditSave(guildId, session, interaction) {
    const result = await saveReminder(guildId, session, interaction);
    clearSession(guildId);

    await interaction.editReply({
        components: [
            {
                type: 17,
                accent_color: 0xfefdfe,
                components: [
                    { type: 10, content: `### ${emoji.check} تم حفظ التعديلات بنجاح` },
                    { type: 14, divider: true, spacing: 1 },
                    { type: 10, content: 'تم تحديث بيانات التذكير بنجاح. سيتم تطبيق التغييرات فوراً.' },
                ],
            },
        ],
        flags: 32832,
    });
}

async function handleEditCancel(guildId, interaction) {
    clearSession(guildId);
    await interaction.editReply({
        components: [
            {
                type: 17,
                accent_color: 0xfefdfe,
                components: [
                    { type: 10, content: `### ${emoji.close} تم إلغاء التعديل` },
                    { type: 14, divider: true, spacing: 1 },
                    { type: 10, content: 'تم إلغاء عملية التعديل. البيانات الأصلية لم تتغير.' },
                ],
            },
        ],
        flags: 32832,
    });
}

module.exports.handleEditStart = handleEditStart;
module.exports.handleEditCountry = handleEditCountry;
module.exports.handleEditCity = handleEditCity;
module.exports.handleEditPrayers = handleEditPrayers;
module.exports.handleEditChannel = handleEditChannel;
module.exports.handleEditRoles = handleEditRoles;
module.exports.handleEditSave = handleEditSave;
module.exports.handleEditCancel = handleEditCancel;
