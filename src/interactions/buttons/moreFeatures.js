const { wrapInteraction, safeReply } = require('@interactions/flow/responder');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createStandardEmbed } = require('@ui/embedFactory');

module.exports = {
    customId: 'more_features',
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const components = [
                    {
                        type: 17,
                        accent_color: 0xfefdfe,
                        components: [
                            { type: 10, content: '### المزيد من الميزات' },
                            { type: 14, divider: true, spacing: 1 },
                            { type: 10, content: 'يمكنك الوصول إلى الميزات الإضافية من الأزرار أدناه.' },
                            {
                                type: 1,
                                components: [
                                    { type: 2, custom_id: 'assign_channels', label: 'تعيين القنوات', style: 2 },
                                    { type: 2, custom_id: 'prayer_times', label: 'مواقيت الصلاة', style: 2 },
                                    { type: 2, custom_id: 'lavalink_status', label: 'حالة خادم الصوت (Lavalink)', style: 2 },
                                    { type: 2, custom_id: 'submit_complaint', label: 'تقديم شكوى او اقتراح', style: 2 },
                                    { type: 2, custom_id: 'spread_bot', label: 'ساعدنا في انتشار البوت', style: 2 },
                                ],
                            },
                        ],
                    },
                ];
                await safeReply(interaction, { components, flags: 32832 }, 'more_features_button');
            },
            { ephemeral: true, label: 'more_features_button' },
        );
    },
};
