require('pathlra-aliaser')();
const fs = require('fs').promises;
const pathlra = require('path');
const {
   ChannelType,
   PermissionsBitField,
   OverwriteType,
   EmbedBuilder,
} = require('discord.js');
const { getGuildState } = require('@GuildStateManager-core_state');
const logger = require('@logger');
const backupManager = require('@BackupManager-core_state').backupManager;
const {
   loadSetupGuildsFromFirebase,
   saveSetupGuildsToFirebase,
} = require('@firebase-core_utils');
let startAzkarTimerForGuild;
try {
   ({ startAzkarTimerForGuild } = require('@AzkarManager-core_state'));
} catch (error) {
   logger.error('Failed to load AzkarManager using fallback', error);
   startAzkarTimerForGuild = (guildId, channelId) => {
      logger.warn('Fallback azkar timer for guild' + guildId);
      const state = getGuildState(guildId);
      if (state.azkarTimer) return;
      state.azkarChannelId = channelId;
      setInterval(() => {
         const channel = global.client.channels.cache.get(channelId);
         if (channel) channel.send('🕋 ذكر لا يمكن توليد الصور حالياً');
      }, 10000);
      state.azkarTimer = true;
   };
}
const { createControlEmbed } = require('@embeds-core_ui');
const {
   createReciterRow,
   createSelectRow,
   createButtonRow,
   createNavigationRow,
   createRadioRow,
} = require('@components-core_ui');
const { saveControlId } = require('@controlIds-core_utils');
async function safeSaveSetupGuilds() {
   try {
      const currentLiveDBData = await loadSetupGuildsFromFirebase();
      const localData = global.setupGuilds || {};
      const mergedData = { ...currentLiveDBData };
      for (const [gid, data] of Object.entries(localData)) {
         mergedData[gid] = {
            ...mergedData[gid],
            ...data,
         };
      }
      await saveSetupGuildsToFirebase(mergedData);
      global.setupGuilds = mergedData;
      logger.info('Setup guilds saved');
   } catch (error) {
      logger.error('setup guilds', error);
   }
}
async function setupQuranCategory(guild, interaction, options = {}) {
   const backupManager = require('@BackupManager-core_state').backupManager;
   const { channelWillBeDeleted = false } = options;
   const guildId = guild.id;
   const state = getGuildState(guildId);
   state.isPaused = true;
   state.pauseReason = 'manual';
   state.playbackMode = 'surah';
   if (!backupManager || !backupManager.createBackup) {
      logger.warn('Backup Manager not properly initialized');
   }
   if (state.connection && !state.connection.destroyed) {
      try {
         state.connection.unsubscribe(state.player);
      } catch (error) {
         logger.info('Error unsubscribing player in guild' + guildId, error);
      }
   }

   if (state.azkarTimer) {
      clearInterval(state.azkarTimer);
      state.azkarTimer = null;
      state.azkarChannelId = null;
   }
   let isReSetup = false;
   let oldSetup = null;
   if (global.setupGuilds && global.setupGuilds[guildId]) {
      isReSetup = true;
      oldSetup = global.setupGuilds[guildId];
      const subChannelIds = [
         oldSetup.voiceChannelId,
         oldSetup.textChannelId,
         oldSetup.azkarChannelId,
      ];
      for (const chId of subChannelIds) {
         if (!chId) continue;
         try {
            const channel =
               guild.channels.cache.get(chId) ||
               (await guild.channels.fetch(chId).catch(() => null));
            if (channel) {
               await channel.delete('Re-setup of Quran bot');
               await new Promise((resolve) => setTimeout(resolve, 800));
            }
         } catch (error) {
            logger.error('Error deleting channel ' + chId + ' in guild ' + guildId, error);
         }
      }
      try {
         if (oldSetup.categoryId) {
            const oldCategory =
               guild.channels.cache.get(oldSetup.categoryId) ||
               (await guild.channels.fetch(oldSetup.categoryId).catch(() => null));
            if (oldCategory) {
               const children = oldCategory.children.cache;
               for (const [childId, child] of children) {
                  try {
                     await child.delete('Re-setup of Quran bot - child channel');
                  } catch (e) {
                     logger.warn('Failed to delete child channel ' + childId);
                  }
               }
               await new Promise((resolve) => setTimeout(resolve, 500));
               await oldCategory.delete('Re-setup of Quran bot');
               await new Promise((resolve) => setTimeout(resolve, 800));
            }
         }
      } catch (error) {
         logger.error('Error deleting category in guild ' + guildId, error);
      }
   }

   try {
      let category = guild.channels.cache.find(
         (c) => c.name === '🕋︱القُرآن الكريم' && c.type === ChannelType.GuildCategory,
      );
      if (!category) {
         category = await guild.channels.create({
            name: '🕋︱القُرآن الكريم',
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
               {
                  id: guild.roles.everyone.id,
                  deny: [PermissionsBitField.Flags.ViewChannel],
               },
               {
                  id: interaction.user.id,
                  type: OverwriteType.Member,
                  allow: [
                     PermissionsBitField.Flags.ViewChannel,
                     PermissionsBitField.Flags.ManageChannels,
                  ],
               },
            ],
            reason:
               (isReSetup ? 'Re-setup' : 'Setup') + ' Quran bot by ' + interaction.user.tag,
         });
      }

      let voiceChannel = guild.channels.cache.find(
         (c) =>
            c.name === '🕌︱بثّ القُرآن الكريم' &&
            c.type === ChannelType.GuildVoice &&
            c.parentId === category.id,
      );

      if (!voiceChannel) {
         voiceChannel = await guild.channels.create({
            name: '🕌︱بثّ القُرآن الكريم',
            type: ChannelType.GuildVoice,
            parent: category.id,
            bitrate: 64000,
            userLimit: 0,
            permissionOverwrites: [
               {
                  id: guild.roles.everyone.id,
                  allow: [
                     PermissionsBitField.Flags.ViewChannel,
                     PermissionsBitField.Flags.Connect,
                  ],
                  deny: [
                     PermissionsBitField.Flags.Speak,
                     PermissionsBitField.Flags.Stream,
                     PermissionsBitField.Flags.UseEmbeddedActivities,
                     PermissionsBitField.Flags.UseSoundboard,
                  ],
               },
               {
                  id: interaction.user.id,
                  type: OverwriteType.Member,
                  allow: [
                     PermissionsBitField.Flags.ViewChannel,
                     PermissionsBitField.Flags.Connect,
                     PermissionsBitField.Flags.ManageChannels,
                  ],
               },
            ],
            reason:
               (isReSetup ? 'Re-setup' : 'Setup') + ' Quran bot by ' + interaction.user.tag,
         });
      }
      let textChannel = guild.channels.cache.find(
         (c) =>
            c.name === '📖︱تحكم البوت القرآني' &&
            c.type === ChannelType.GuildText &&
            c.parentId === category.id,
      );

      if (!textChannel) {
         textChannel = await guild.channels.create({
            name: '📖︱تحكم البوت القرآني',
            type: ChannelType.GuildText,
            parent: category.id,
            rateLimitPerUser: 0,
            permissionOverwrites: [
               {
                  id: guild.roles.everyone.id,
                  allow: [
                     PermissionsBitField.Flags.ViewChannel,
                     PermissionsBitField.Flags.ReadMessageHistory,
                  ],
                  deny: [
                     PermissionsBitField.Flags.SendMessages,
                     PermissionsBitField.Flags.AddReactions,
                  ],
               },
               {
                  id: interaction.user.id,
                  type: OverwriteType.Member,
                  allow: [
                     PermissionsBitField.Flags.ViewChannel,
                     PermissionsBitField.Flags.SendMessages,
                     PermissionsBitField.Flags.ManageChannels,
                     PermissionsBitField.Flags.ReadMessageHistory,
                     PermissionsBitField.Flags.AddReactions,
                  ],
               },
            ],
            reason:
               (isReSetup ? 'Re-setup' : 'Setup') + ' Quran bot by ' + interaction.user.tag,
         });
      }
      let azkarChannel = guild.channels.cache.find(
         (c) =>
            c.name === '🌙︱الأذكار' &&
            c.type === ChannelType.GuildText &&
            c.parentId === category.id,
      );
      if (!azkarChannel) {
         azkarChannel = await guild.channels.create({
            name: '🌙︱الأذكار',
            type: ChannelType.GuildText,
            parent: category.id,
            rateLimitPerUser: 0,
            permissionOverwrites: [
               {
                  id: guild.roles.everyone.id,
                  allow: [
                     PermissionsBitField.Flags.ViewChannel,
                     PermissionsBitField.Flags.ReadMessageHistory,
                  ],
                  deny: [
                     PermissionsBitField.Flags.SendMessages,
                     PermissionsBitField.Flags.AddReactions,
                  ],
               },
               {
                  id: interaction.user.id,
                  type: OverwriteType.Member,
                  allow: [
                     PermissionsBitField.Flags.ViewChannel,
                     PermissionsBitField.Flags.SendMessages,
                     PermissionsBitField.Flags.ManageChannels,
                     PermissionsBitField.Flags.ReadMessageHistory,
                     PermissionsBitField.Flags.AddReactions,
                  ],
               },
            ],
            reason:
               (isReSetup ? 'Re-setup' : 'Setup') + ' Quran bot by ' + interaction.user.tag,
         });
      }
      state.azkarChannelId = azkarChannel.id;
      startAzkarTimerForGuild(guildId, azkarChannel.id, true);
      if (!global.setupGuilds) {
         global.setupGuilds = {};
      }
      global.setupGuilds[guildId] = {
         categoryId: category.id,
         voiceChannelId: voiceChannel.id,
         textChannelId: textChannel.id,
         azkarChannelId: azkarChannel.id,
      };
      await safeSaveSetupGuilds();
      await backupManager.createBackup();
      const embed = createControlEmbed(state, guildId);
      let components = [];
      if (state.playbackMode === 'surah') {
         components.push(createReciterRow(state));
         components.push(createSelectRow(state));
      } else {
         components.push(createRadioRow(state));
      }
      components.push(createButtonRow(state));
      components.push(...createNavigationRow(state, guildId));
      const message = await textChannel.send({
         content:
            'تم ' +
            (isReSetup ? 'إعادة ' : '') +
            'إعداد فئة القرآن بواسطة <@' +
            interaction.user.id +
            '> استخدم اللوحة أدناه للتحكم الأدمنز تحكم كامل دائماً',
         embeds: [embed],
         components: components,
      });
      await saveControlId(guildId, textChannel.id, message.id);
      return { category, voiceChannel, textChannel, azkarChannel };
   } catch (error) {
      if (
         !(
            error.message?.includes('Missing Permissions') ||
            error.message?.includes('Missing Access') ||
            error.code === 50013
         )
      ) {
         logger.error('Error setting up Quran category in guild ' + guildId, error);
      }
      throw error;
   }
}
async function autoSetupAllGuilds(client) {
   try {
      const setupGuilds = global.setupGuilds || {};
      let successCount = 0;
      let failCount = 0;
      for (const [guildId, setupData] of Object.entries(setupGuilds)) {
         try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
               logger.warn('Guild ' + guildId + ' not found for auto-setup');
               failCount++;
               continue;
            }
            const fakeInteraction = {
               guild: guild,
               user: client.user,
               channel: await guild.channels.fetch(setupData.textChannelId).catch(() => null),
            };
            if (!fakeInteraction.channel) {
               fakeInteraction.channel = guild.channels.cache.find(
                  (c) => c.type === ChannelType.GuildText,
               );
            }
            if (!fakeInteraction.channel) {
               logger.warn('No text channel found for guild ' + guildId);
               failCount++;
               continue;
            }
            await setupQuranCategory(guild, fakeInteraction, {
               channelWillBeDeleted: false,
            });
            successCount++;
            logger.info('Auto-setup completed for guild ' + guildId);
         } catch (error) {
            logger.error('Auto-setup failed for guild ' + guildId, error);
            failCount++;
         }
      }
      logger.info('Auto-setup complete ' + successCount + ' success ' + failCount + ' failed');
      return { success: successCount, failed: failCount };
   } catch (error) {
      logger.error('Auto-setup all guilds failed', error);
      return {
         success: 0,
         failed: Object.keys(global.setupGuilds || {}).length,
         error: error.message,
      };
   }
}
module.exports.setupQuranCategory = setupQuranCategory;
module.exports.autoSetupAllGuilds = autoSetupAllGuilds;
