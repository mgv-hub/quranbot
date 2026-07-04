const { wrapInteraction, safeReply } = require('@interactions/flow/responder');
const coreLoader = require('@bot/bootstrap');
const { emoji, gif } = require('@helpers/emojis');

module.exports = {
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const guildState = coreLoader.getGuildState(interaction.guildId);
                // Construct guide embed with usage instructions
                const components = [
                    {
                        type: 17,
                        accent_color: 0xfefdfe,
                        components: [
                            {
                                type: 10,
                                content: `### ${emoji.help} دليل استخدام البوت`,
                            },
                            {
                                type: 14,
                                divider: true,
                                spacing: 1,
                            },
                            {
                                type: 10,
                                content:
                                    '`/إعداد`\n' +
                                    'إعداد فئة القرآن الكريم (سيتم إنشاء قنوات تلقائيًا)\n\n' +
                                    '`/دخول`\n' +
                                    'الانضمام إلى الروم الصوتي (بعد الإعداد)\n\n' +
                                    '`/خروج`\n' +
                                    'الخروج من الروم الصوتي\n\n' +
                                    '`/تحكم`\n' +
                                    'عرض لوحة التحكم\n\n' +
                                    '`/سرعة`\n' +
                                    'عرض سرعة البوت، ومدة التشغيل، وعدد السيرفرات الحالي',
                            },
                        ],
                    },
                ];
                await safeReply(interaction, { components, flags: 32832 }, 'guide_command');
            },
            { ephemeral: true, label: 'guide_command' },
        );
    },
};
