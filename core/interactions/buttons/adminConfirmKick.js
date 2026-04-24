require('pathlra-aliaser')();
const { EmbedBuilder } = require('discord.js');
const logger = require('@logger');

module.exports = {
   customId: 'admin_confirm_kick',
   async execute(interaction) {
      const userId = interaction.user.id;
      const isSpecialUser = global.SPE_USER_IDS.includes(userId);

      if (!isSpecialUser) {
         return interaction.reply({
            content: 'This feature is available for the developer only',
            flags: 64,
         });
      }

      await interaction.deferUpdate();

      const customId = interaction.customId;
      const guildId = customId.replace('admin_confirm_kick_', '');

      const client = global.client;
      const guild = client.guilds.cache.get(guildId);

      if (!guild) {
         return interaction.followUp({
            content: 'Server not found',
            flags: 64,
         });
      }

      try {
         await guild.leave();

         const { removeGuildState } = require('@GuildStateManager-core_state');
         removeGuildState(guildId);

         const { persistentStateManager } = require('@loader-core_bootstrap');
         persistentStateManager.clearGuildState(guildId);

         logger.info(
            `Admin ${interaction.user.tag} kicked bot from guild ${guild.name} (${guildId})`,
         );

         const successEmbed = new EmbedBuilder()
            .setColor(0x1e1f22)
            .setTitle('Bot Left Successfully')
            .setDescription(
               `**Bot removed from server:**\n\n${guild.name}\n${guild.memberCount} members\n\`${guildId}\``,
            );
         await interaction.followUp({
            embeds: [successEmbed],
            flags: 64,
         });
      } catch (error) {
         logger.error('Error kicking bot from guild', error);
         await interaction.followUp({
            content: `An error occurred while leaving: ${error.message}`,
            flags: 64,
         });
      }
   },
};
