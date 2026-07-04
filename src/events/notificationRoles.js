const logger = require('@logging/logger');
const { getNotificationRolesMessageId, saveNotificationRolesMessageId } = require('@database/firebase/services/notificationRoles.service');

const components = {
    flags: 32768,
    components: [
        {
            type: 17,
            accent_color: 0xfefdfe,
            components: [
                {
                    type: 10,
                    content: '* Notification Roles \nChoose the types of notifications you want to receive.',
                },
                {
                    type: 14,
                    divider: true,
                    spacing: 1,
                },
                {
                    type: 10,
                    content:
                        'By clicking the buttons below, the bot will assign or remove the corresponding role from your account.\n- **`All Notifications`**: Alerts for all releases (major, minor, patches).\n- **`Major Updates`**: Notifications for big features and major changes.\n- **`Minor Updates`**: Notifications for small improvements and bug fixes.',
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            custom_id: 'notify_all',
                            label: 'All Notifications',
                            style: 2,
                        },
                        {
                            type: 2,
                            custom_id: 'notify_major',
                            label: 'Major Updates',
                            style: 2,
                        },
                        {
                            type: 2,
                            custom_id: 'notify_minor',
                            label: 'Minor Updates',
                            style: 2,
                        },
                    ],
                },
            ],
        },
    ],
};

async function setupNotificationRoles(client) {
    if (process.env.NOTIFICATION_ROLES_ENABLED !== 'true') return;
    const channelId = process.env.NOTIFICATION_ROLES_CHANNEL_ID;

    if (!channelId) return;
    const channel = await client.channels.fetch(channelId).catch(() => null);

    if (!channel || !channel.isTextBased()) return;
    const messageId = await getNotificationRolesMessageId();

    let targetMsg = null;
    if (messageId) {
        targetMsg = await channel.messages.fetch(messageId).catch(() => null);
    }

    if (targetMsg) {
        await targetMsg.edit(components);
        return;
    }

    const newMessage = await channel.send(components);
    await saveNotificationRolesMessageId(newMessage.id);
}

module.exports.setupNotificationRoles = setupNotificationRoles;
