const logger = require('@logging/logger');
const {
    saveComplaintToFirebase,
    loadUserCooldownFromFirebase,
    saveUserCooldownToFirebase,
    isFirebaseReady,
} = require('@database/firebase');
const { MessageFlags } = require('discord.js');

module.exports = {
    customId: 'complaint_modal',

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const guildName = interaction.guild.name;
        const channelId = interaction.channelId;
        const channelName = interaction.channel.name || 'Unknown Channel';
        const channelType = interaction.channel.type;

        // Check user submission cooldown to prevent spam (24 hour limit)
        const lastSubmission = await loadUserCooldownFromFirebase(userId);
        const currentTime = Date.now();
        const cooldownPeriod = 24 * 60 * 60 * 1000;

        if (lastSubmission && lastSubmission.lastSubmission && currentTime - lastSubmission.lastSubmission < cooldownPeriod) {
            const remainingHours = Math.ceil((cooldownPeriod - (currentTime - lastSubmission.lastSubmission)) / (1000 * 60 * 60));
            return interaction.reply({
                content: `يجب الانتظار ${remainingHours} ساعة قبل تقديم شكوى جديدة`,
                flags: MessageFlags.Ephemeral,
            });
        }

        const reason = interaction.fields.getTextInputValue('complaint_reason');
        const suggestion = interaction.fields.getTextInputValue('complaint_suggestion') || 'لا يوجد';
        const experience = interaction.fields.getTextInputValue('complaint_experience');

        // Assemble complaint object with full context for support team review
        const complaintData = {
            userId,
            userTag: interaction.user.tag,
            userName: interaction.user.username,
            userGlobalName: interaction.user.globalName || interaction.user.username,
            guildId,
            guildName,
            channelId,
            channelName,
            channelType,
            reason,
            suggestion,
            experience,
            submittedAt: new Date().toISOString(),
        };

        try {
            // Persist complaint to Firebase for support team access
            const wasSaved = await saveComplaintToFirebase(complaintData);
            if (wasSaved) {
                await saveUserCooldownToFirebase(userId, currentTime);
                logger.info(`New Complaint From ${interaction.user.tag} In ${guildName} Channel ${channelName} Saved To Firebase`);
            }

            await interaction.reply({
                content:
                    'تم استلام شكواك أو اقتراحك بنجاح، شكرًا لمساهمتك \nسيتم مراجعتها من قبل فريق الدعم.\nيرجى التأكد من إبقاء الرسائل الخاصة (DM) مفتوحة للبوتات، حيث سيتم التواصل معك هناك في حال وجود رد.',
                flags: MessageFlags.Ephemeral,
            });
        } catch (error) {
            logger.error('Error Processing Complaint', error);

            await interaction.reply({
                content: 'تم استلام شكواك أو اقتراحك بنجاح شكرًا لمساهمتك',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
