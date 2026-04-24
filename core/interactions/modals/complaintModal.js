require('pathlra-aliaser')();
const logger = require('@logger');
const {
   saveComplaintToFirebase,
   loadUserCooldownFromFirebase,
   saveUserCooldownToFirebase,
   isFirebaseReady,
} = require('@firebase-core_utils');
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
      const lastSubmission = await loadUserCooldownFromFirebase(userId);
      const now = Date.now();
      const cooldownMs = 24 * 60 * 60 * 1000;
      if (
         lastSubmission &&
         lastSubmission.lastSubmission &&
         now - lastSubmission.lastSubmission < cooldownMs
      ) {
         const remainingHours = Math.ceil(
            (cooldownMs - (now - lastSubmission.lastSubmission)) / (1000 * 60 * 60),
         );
         return interaction.reply({
            content: `يجب الانتظار ${remainingHours} ساعة قبل تقديم شكوى جديدة`,
            flags: MessageFlags.Ephemeral,
         });
      }
      const reason = interaction.fields.getTextInputValue('complaint_reason');
      const suggestion =
         interaction.fields.getTextInputValue('complaint_suggestion') || 'لا يوجد';
      const experience = interaction.fields.getTextInputValue('complaint_experience');
      const complaint = {
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
         const saved = await saveComplaintToFirebase(complaint);
         if (saved) {
            await saveUserCooldownToFirebase(userId, now);
            logger.info(
               `New Complaint From ${interaction.user.tag} In ${guildName} Channel ${channelName} Saved To Firebase`,
            );
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
