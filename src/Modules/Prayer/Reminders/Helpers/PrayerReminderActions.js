const { ChannelType, PermissionsBitField, OverwriteType } = require('discord.js');
const prayerReminderManager = require('@modules/Prayer/Reminders/Services/PrayerReminderManager');
const { channel_names } = require('@config/Constants');
const logger = require('@infrastructure/Logging/Logger');
const { emoji } = require('@shared/Helpers/Emojis');

async function createAutoChannel(guild, interaction) {
    let category = guild.channels.cache.find((c) => c.name === channel_names.category && c.type === ChannelType.GuildCategory);

    if (!category) {
        try {
            category = await guild.channels.create({
                name: channel_names.category,
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                    },
                    { id: guild.client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels] },
                    {
                        id: interaction.user.id,
                        type: OverwriteType.Member,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels],
                    },
                ],
                reason: 'Auto-create category for prayer reminders',
            });
        } catch (err) {
            return { success: false, error: 'فشل إنشاء الفئة تلقائياً. يرجى التحقق من صلاحيات البوت.' };
        }
    }

    let channel;
    try {
        channel = await guild.channels.create({
            name: channel_names.prayer_reminder,
            type: ChannelType.GuildText,
            parent: category.id,
            rateLimitPerUser: 0,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                    deny: [
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.EmbedLinks,
                        PermissionsBitField.Flags.AttachFiles,
                    ],
                },
                {
                    id: guild.client.user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ManageChannels,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.EmbedLinks,
                        PermissionsBitField.Flags.AttachFiles,
                    ],
                },
            ],
            reason: 'Auto-create channel for prayer reminders',
        });
    } catch (err) {
        return { success: false, error: 'فشل إنشاء القناة تلقائياً. يرجى التحقق من صلاحيات البوت.' };
    }

    return { success: true, channelId: channel.id };
}

async function saveReminder(guildId, session, interaction) {
    const channel =
        interaction.guild.channels.cache.get(session.channelId) ||
        (await interaction.guild.channels.fetch(session.channelId).catch(() => null));
    const channelName = channel?.name || 'Unknown';
    const username = interaction.user.globalName || interaction.user.username;

    await prayerReminderManager.set(guildId, {
        enabled: true,
        countryCode: session.countryCode,
        countryName: session.countryName,
        cityName: session.cityName,
        lat: session.lat,
        lng: session.lng,
        method: session.method,
        prayers: session.prayers,
        channelId: session.channelId,
        channelName: channelName,
        roles: session.roles || [],
        mentionEveryone: session.mentionEveryone || false,
        mentionHere: session.mentionHere || false,
        createdBy: session.createdBy || interaction.user.id,
        createdByName: session.createdByName || username,
        createdAt: session.createdAt || Date.now(),
    });

    const { calculateDailyJobs } = require('@modules/Prayer/Reminders/Services/PrayerReminderSchedulerModule');
    await calculateDailyJobs();

    return { success: true, channel, channelName };
}

async function sendConfirmation(channel, session) {
    if (!channel || !channel.isTextBased()) {
        return { success: false, sent: false };
    }

    const prayerNames = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
    const selectedPrayers = session.prayers.map((p) => prayerNames[p] || p).join('، ');

    const confirmationComponents = [
        {
            type: 17,
            accent_color: 0xfefdfe,
            components: [
                { type: 10, content: `### ${emoji.check} تم تفعيل تذكير الصلاة بنجاح` },
                { type: 14, divider: true, spacing: 1 },
                { type: 10, content: `**الموقع:** ${session.cityName} - ${session.countryName}` },
                { type: 10, content: `**القناة:** <#${session.channelId}>` },
                { type: 10, content: `**الصلوات:** ${selectedPrayers}` },
                { type: 10, content: `**التوقيت:** قبل الأذان بـ 5 دقائق` },
                { type: 14, divider: true, spacing: 1 },
                { type: 10, content: `*سيتم إرسال التذكيرات تلقائياً في الأوقات المحددة*` },
            ],
        },
    ];

    try {
        await channel.send({
            components: confirmationComponents,
            flags: 32768,
            allowed_mentions: { parse: [] },
        });
        return { success: true, sent: true };
    } catch (sendErr) {
        logger.error('Failed to send prayer reminder confirmation', {
            guildId: channel.guildId,
            channelId: session.channelId,
            error: sendErr.message,
        });
        return { success: true, sent: false };
    }
}

module.exports.createAutoChannel = createAutoChannel;
module.exports.saveReminder = saveReminder;
module.exports.sendConfirmation = sendConfirmation;
