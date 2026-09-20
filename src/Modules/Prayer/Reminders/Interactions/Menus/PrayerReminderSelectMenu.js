const { wrapInteraction, safeError } = require('@infrastructure/Discord/Flow/DeferReply');
const { resolveGuildState } = require('@core/Auth/AuthGuard');
const { getCountries, getCitiesForCountry, getCountryByCode } = require('@data/PrayerTimes/PrayerTimesData');
const {
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ChannelSelectMenuBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const { emoji } = require('@shared/Helpers/Emojis');
const logger = require('@infrastructure/Logging/Logger');
const { getSession } = require('@modules/Prayer/Reminders/Helpers/PrayerReminderSession');
const {
    buildCountrySelect,
    buildCitySelect,
    buildPrayerSelect,
    buildChannelSelect,
    buildRoleSelect,
    buildConfirm,
    buildEditMenu,
} = require('@modules/Prayer/Reminders/Helpers/PrayerReminderUI');

async function sendSmartMessage(interaction, content) {
    const channel = interaction.channel;
    if (channel) {
        try {
            await channel.send({
                content,
                flags: 32768,
                allowed_mentions: { parse: [] },
            });
        } catch (replyErr) {
            logger.error('Error sending smart message', replyErr);
        }
    }
}

module.exports = {
    customId: 'pr_reminder_selects',
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const { guildId } = resolveGuildState(interaction);
                const customId = interaction.customId;
                const selectedValue = interaction.values?.[0];
                const selectedValues = interaction.values || [];
                const session = getSession(guildId);

                if (customId === 'pr_reminder_select_country') {
                    if (selectedValue === 'no_countries') {
                        return safeError(interaction, 'لا توجد دول متاحة حالياً');
                    }
                    const country = getCountryByCode(selectedValue);
                    if (!country) return safeError(interaction, 'الدولة غير صالحة');
                    session.countryCode = country.code;
                    session.countryName = country.name;

                    const cities = getCitiesForCountry(country.code);
                    if (!cities || cities.length === 0) {
                        return safeError(interaction, 'لا توجد مدن متاحة لهذه الدولة');
                    }

                    await interaction.editReply({ components: [buildCitySelect(cities, country.code)], flags: 32832 });
                } else if (customId === 'pr_reminder_select_city') {
                    const [countryCode, cityIndex] = selectedValue.split('_');
                    const cities = getCitiesForCountry(countryCode);
                    const city = cities[parseInt(cityIndex)];
                    if (!city) return safeError(interaction, 'المدينة غير صالحة');

                    session.cityName = city.name;
                    session.lat = city.lat;
                    session.lng = city.lng;

                    if (session.isEdit) {
                        await interaction.editReply({ components: [buildEditMenu(session)], flags: 32832 });
                    } else {
                        await interaction.editReply({ components: [buildPrayerSelect()], flags: 32832 });
                    }
                } else if (customId === 'pr_reminder_select_prayers') {
                    session.prayers = selectedValues;
                    if (session.isEdit) {
                        await interaction.editReply({ components: [buildEditMenu(session)], flags: 32832 });
                    } else {
                        const guild = interaction.guild;
                        const { channel_names } = require('@config/Constants');
                        const { ChannelType } = require('discord.js');
                        const hasCategory = guild.channels.cache.some((c) => c.name === channel_names.category && c.type === ChannelType.GuildCategory);
                        const { buildChannelPrompt } = require('@modules/Prayer/Reminders/Helpers/PrayerReminderUI');
                        await interaction.editReply({ components: [buildChannelPrompt(session, hasCategory)], flags: 32832 });
                    }
                } else if (customId === 'pr_reminder_select_channel') {
                    session.channelId = selectedValue;

                    if (session.isEdit) {
                        await interaction.editReply({ components: [buildEditMenu(session)], flags: 32832 });
                    } else {
                        await interaction.editReply({ components: [buildRoleSelect(session)], flags: 32832 });
                    }
                } else if (customId === 'pr_reminder_select_roles') {
                    if (selectedValues.length > 3) {
                        const warningMsg = `${emoji.exclamation} **الحد الأقصى لعدد الرتب هو 3 رتب فقط.**\nيرجى اختيار 3 رتب أو أقل للمتابعة.`;
                        await sendSmartMessage(interaction, warningMsg);
                        return;
                    }
                    session.roles = selectedValues;

                    if (session.isEdit) {
                        await interaction.editReply({ components: [buildEditMenu(session)], flags: 32832 });
                    } else {
                        const channel = interaction.guild.channels.cache.get(session.channelId) || (await interaction.guild.channels.fetch(session.channelId).catch(() => null));
                        const channelName = channel?.name || 'Unknown';
                        const username = interaction.user.globalName || interaction.user.username;
                        const metadata = { userId: interaction.user.id, username, channelName };
                        await interaction.editReply({ components: [buildConfirm(session, metadata)], flags: 32832 });
                    }
                }
            },
            { context: { label: 'prayer_reminder_select_menu' } },
        );
    },
};
