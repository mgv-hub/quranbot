const { wrapInteraction, safeError } = require('@infrastructure/Discord/Flow/DeferReply');
const { resolveGuildState } = require('@core/Auth/AuthGuard');
const { getCountries, getCitiesForCountry } = require('@data/PrayerTimes/PrayerTimesData');
const { ChannelType } = require('discord.js');
const { channel_names } = require('@config/Constants');
const { emoji } = require('@shared/Helpers/Emojis');
const { getSession, clearSession } = require('@modules/Prayer/Reminders/Helpers/PrayerReminderSession');
const {
    buildCountrySelect,
    buildCitySelect,
    buildPrayerSelect,
    buildChannelPrompt,
    buildChannelSelect,
    buildRoleSelect,
    buildConfirm,
    buildEditMenu,
} = require('@modules/Prayer/Reminders/Helpers/PrayerReminderUI');
const { createAutoChannel, saveReminder, sendConfirmation } = require('@modules/Prayer/Reminders/Helpers/PrayerReminderActions');
const {
    handleStart,
    handleDisable,
    handlePause,
    handleResume,
    handleCancel,
} = require('@modules/Prayer/Reminders/Interactions/Buttons/PrayerReminderSetupActions');
const {
    handleEditStart,
    handleEditCountry,
    handleEditCity,
    handleEditPrayers,
    handleEditChannel,
    handleEditRoles,
    handleEditSave,
    handleEditCancel,
} = require('@modules/Prayer/Reminders/Interactions/Buttons/PrayerReminderSetupEdit');

module.exports.customId = 'pr_reminder_setup';
module.exports.execute = async function execute(interaction) {
    await wrapInteraction(
        interaction,
        async () => {
            const { guildId } = resolveGuildState(interaction);
            const customId = interaction.customId;
            const session = getSession(guildId);

            switch (customId) {
                case 'pr_reminder_start':
                    session.isEdit = false;
                    await handleStart(interaction);
                    break;

                case 'pr_reminder_disable':
                    await handleDisable(guildId, interaction);
                    break;

                case 'pr_reminder_pause':
                    await handlePause(guildId, interaction);
                    break;

                case 'pr_reminder_resume':
                    await handleResume(guildId, interaction);
                    break;

                case 'pr_reminder_edit':
                    await handleEditStart(guildId, session, interaction);
                    break;

                case 'pr_reminder_edit_country':
                    await handleEditCountry(session, interaction);
                    break;

                case 'pr_reminder_edit_city':
                    await handleEditCity(session, interaction);
                    break;

                case 'pr_reminder_edit_prayers':
                    await handleEditPrayers(session, interaction);
                    break;

                case 'pr_reminder_edit_channel':
                    await handleEditChannel(session, interaction);
                    break;

                case 'pr_reminder_edit_roles':
                    await handleEditRoles(session, interaction);
                    break;

                case 'pr_reminder_edit_save':
                    await handleEditSave(guildId, session, interaction);
                    break;

                case 'pr_reminder_edit_cancel':
                    await handleEditCancel(guildId, interaction);
                    break;

                case 'pr_reminder_back_country':
                    if (session.isEdit) {
                        await interaction.editReply({ components: [buildEditMenu(session)], flags: 32832 });
                    } else {
                        const countries = getCountries();
                        await interaction.editReply({ components: [buildCountrySelect(countries)], flags: 32832 });
                    }
                    break;

                case 'pr_reminder_back_city':
                    if (session.isEdit) {
                        await interaction.editReply({ components: [buildEditMenu(session)], flags: 32832 });
                    } else {
                        const cities = getCitiesForCountry(session.countryCode);
                        await interaction.editReply({ components: [buildCitySelect(cities, session.countryCode)], flags: 32832 });
                    }
                    break;

                case 'pr_reminder_back_prayers':
                    if (session.isEdit) {
                        await interaction.editReply({ components: [buildEditMenu(session)], flags: 32832 });
                    } else {
                        await interaction.editReply({ components: [buildPrayerSelect()], flags: 32832 });
                    }
                    break;

                case 'pr_reminder_manual_channel':
                    await interaction.editReply({ components: [buildChannelSelect()], flags: 32832 });
                    break;

                case 'pr_reminder_back_channel_prompt':
                    if (session.isEdit) {
                        await interaction.editReply({ components: [buildEditMenu(session)], flags: 32832 });
                    } else {
                        const guild = interaction.guild;
                        const hasCategory = guild.channels.cache.some(
                            (c) => c.name === channel_names.category && c.type === ChannelType.GuildCategory,
                        );
                        await interaction.editReply({ components: [buildChannelPrompt(session, hasCategory)], flags: 32832 });
                    }
                    break;

                case 'pr_reminder_auto_channel': {
                    const result = await createAutoChannel(interaction.guild, interaction);
                    if (!result.success) {
                        return safeError(interaction, result.error);
                    }
                    session.channelId = result.channelId;
                    if (session.isEdit) {
                        await interaction.editReply({ components: [buildEditMenu(session)], flags: 32832 });
                    } else {
                        await interaction.editReply({ components: [buildRoleSelect(session)], flags: 32832 });
                    }
                    break;
                }

                case 'pr_reminder_back_channel':
                    if (session.isEdit) {
                        await interaction.editReply({ components: [buildEditMenu(session)], flags: 32832 });
                    } else {
                        const guild = interaction.guild;
                        const hasCategory = guild.channels.cache.some(
                            (c) => c.name === channel_names.category && c.type === ChannelType.GuildCategory,
                        );
                        await interaction.editReply({ components: [buildChannelPrompt(session, hasCategory)], flags: 32832 });
                    }
                    break;

                case 'pr_reminder_toggle_everyone':
                    session.mentionEveryone = !session.mentionEveryone;
                    await interaction.editReply({ components: [buildRoleSelect(session)], flags: 32832 });
                    break;

                case 'pr_reminder_toggle_here':
                    session.mentionHere = !session.mentionHere;
                    await interaction.editReply({ components: [buildRoleSelect(session)], flags: 32832 });
                    break;

                case 'pr_reminder_skip_roles':
                    session.roles = [];
                    if (session.isEdit) {
                        await interaction.editReply({ components: [buildEditMenu(session)], flags: 32832 });
                    } else {
                        const channel =
                            interaction.guild.channels.cache.get(session.channelId) ||
                            (await interaction.guild.channels.fetch(session.channelId).catch(() => null));
                        const channelName = channel?.name || 'Unknown';
                        const username = interaction.user.globalName || interaction.user.username;
                        const metadata = { userId: interaction.user.id, username, channelName };
                        await interaction.editReply({ components: [buildConfirm(session, metadata)], flags: 32832 });
                    }
                    break;

                case 'pr_reminder_back_roles':
                    if (session.isEdit) {
                        await interaction.editReply({ components: [buildEditMenu(session)], flags: 32832 });
                    } else {
                        await interaction.editReply({ components: [buildRoleSelect(session)], flags: 32832 });
                    }
                    break;

                case 'pr_reminder_confirm': {
                    const saveResult = await saveReminder(guildId, session, interaction);
                    clearSession(guildId);

                    const confirmResult = await sendConfirmation(saveResult.channel, session);

                    const replyComponents = [
                        {
                            type: 17,
                            accent_color: 0xfefdfe,
                            components: [
                                { type: 10, content: `### ${emoji.check} تم حفظ الإعدادات بنجاح` },
                                { type: 14, divider: true, spacing: 1 },
                                {
                                    type: 10,
                                    content: confirmResult.sent
                                        ? `تم إرسال رسالة تأكيد في القناة <#${session.channelId}>`
                                        : `تم الحفظ، لكن البوت يفتقد صلاحية الإرسال في القناة <#${session.channelId}>. يرجى التحقق من الصلاحيات.`,
                                },
                            ],
                        },
                    ];
                    await interaction.editReply({ components: replyComponents, flags: 32832 });
                    break;
                }

                case 'pr_reminder_cancel':
                    await handleCancel(guildId, interaction);
                    break;
            }
        },
        { context: { label: 'prayer_reminder_setup_button' } },
    );
};

module.exports.getSession = getSession;
module.exports.clearSession = clearSession;
module.exports.buildCountrySelect = buildCountrySelect;
module.exports.buildCitySelect = buildCitySelect;
module.exports.buildPrayerSelect = buildPrayerSelect;
module.exports.buildChannelPrompt = buildChannelPrompt;
module.exports.buildChannelSelect = buildChannelSelect;
module.exports.buildRoleSelect = buildRoleSelect;
module.exports.buildConfirm = buildConfirm;
module.exports.buildEditMenu = buildEditMenu;
