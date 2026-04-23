require('pathlra-aliaser')();
const logger = require('@logger');
const {
   loadSetupGuildsFromFirebase,
   saveSetupGuildsToFirebase,
   loadGuildStatesFromFirebase,
   saveGuildStatesToFirebase,
   loadControlIdsFromFirebase,
   saveControlIdsToFirebase,
} = require('@firebase-core_utils');
const { getGuildState } = require('@GuildStateManager-core_state');
const { startAzkarTimerForGuild } = require('@AzkarManager-core_state');
const { ChannelType, PermissionsBitField, OverwriteType } = require('discord.js');
const { saveControlId } = require('@controlIds-core_utils');
const { createControlEmbed } = require('@embeds-core_ui');
const {
   createReciterRow,
   createSelectRow,
   createButtonRow,
   createNavigationRow,
   createRadioRow,
} = require('@components-core_ui');
function isPlainObject(obj) {
   return (
      obj !== null && typeof obj === 'object' && !Array.isArray(obj) && Object.getPrototypeOf(obj) === Object.prototype
   );
}
function deepCloneForFirebase(obj) {
   if (obj === null || typeof obj !== 'object') {
      return obj;
   }
   if (Array.isArray(obj)) {
      return obj.map((item) => deepCloneForFirebase(item));
   }
   if (isPlainObject(obj)) {
      const cloned = {};
      for (const [key, value] of Object.entries(obj)) {
         if (typeof value !== 'function' && !(value instanceof Promise)) {
            cloned[key] = deepCloneForFirebase(value);
         }
      }
      return cloned;
   }
   return String(obj);
}

class BackupManager {
   constructor() {
      this.backupInterval = 300000;
      this.maxBackups = 5;
      this.isInitialized = false;
      this.backupData = {
         setupGuilds: {},
         guildStates: {},
         controlIds: {},
         timestamp: null,
      };
   }
   async initialize() {
      if (this.isInitialized) return;
      await this.loadBackup();
      this.isInitialized = true;
      this.startAutoBackup();
      logger.info('Backup Manager Initialized Successfully');
   }
   startAutoBackup() {
      setInterval(async () => {
         await this.createBackup();
      }, this.backupInterval);
   }
   async createBackup() {
      try {
         const existingSetupGuilds = await loadSetupGuildsFromFirebase();
         const existingControlIds = await loadControlIdsFromFirebase();
         this.backupData.setupGuilds = {
            ...existingSetupGuilds,
            ...global.setupGuilds,
         };
         this.backupData.guildStates = {};
         for (const [guildId, state] of global.guildStates.entries()) {
            this.backupData.guildStates[guildId] = {
               voiceChannelId: state.channelId,
               playbackMode: state.playbackMode,
               currentReciter: state.currentReciter,
               currentSurah: state.currentSurah,
               currentRadioIndex: state.currentRadioIndex,
               controlMode: state.controlMode,
               azkarChannelId: state.azkarChannelId,
            };
         }
         this.backupData.controlIds = { ...existingControlIds };
         this.backupData.timestamp = Date.now();
         await this.saveBackup();
      } catch (error) {
         logger.error('Failed To Create Backup');
      }
   }
   async saveBackup() {
      try {
         const cleanSetupGuilds = deepCloneForFirebase(this.backupData.setupGuilds);
         const cleanGuildStates = deepCloneForFirebase(this.backupData.guildStates);
         const cleanControlIds = deepCloneForFirebase(this.backupData.controlIds);
         await saveSetupGuildsToFirebase(cleanSetupGuilds);
         await saveGuildStatesToFirebase(cleanGuildStates);
         await saveControlIdsToFirebase(cleanControlIds);
      } catch (error) {
         logger.error('Failed To Save Backup To Firebase');
      }
   }
   async loadBackup() {
      try {
         this.backupData.setupGuilds = await loadSetupGuildsFromFirebase();
         this.backupData.guildStates = await loadGuildStatesFromFirebase();
         this.backupData.controlIds = await loadControlIdsFromFirebase();
         logger.info('Backup Loaded From Firebase');
      } catch (error) {
         logger.error('Failed To Load Backup From Firebase');
      }
   }
   async recoverFromSetupGuilds(client, setupGuilds) {
      try {
         logger.info('Starting Recovery From Setup Guilds Primary Source');
         if (!setupGuilds || Object.keys(setupGuilds).length === 0) {
            logger.warn('No Setup Guilds Found In Firebase');
            return { success: false, reason: 'No setup guilds data' };
         }
         let recoveredCount = 0;
         let failedCount = 0;
         for (const [guildId, setupData] of Object.entries(setupGuilds)) {
            try {
               const guild = client.guilds.cache.get(guildId);
               if (!guild) {
                  logger.warn('Guild ' + guildId + ' Not Found Skipping Recovery');
                  failedCount++;
                  continue;
               }

               const isRecovered = await this.recoverGuildFromSetup(guild, setupData);
               if (isRecovered) {
                  recoveredCount++;
               } else {
                  failedCount++;
               }
            } catch (error) {
               logger.error('Failed To Recover Guild ' + guildId);
               failedCount++;
            }
         }

         logger.info('Recovery Complete From Setup Guilds ' + recoveredCount + ' Recovered ' + failedCount + ' Failed');
         return { success: true, recovered: recoveredCount, failed: failedCount };
      } catch (error) {
         logger.error('Recovery From Setup Guilds Failed');
         return { success: false, reason: error.message };
      }
   }
   async recoverGuildFromSetup(guild, setupData) {
      try {
         const guildId = guild.id;
         let category = null;
         let voiceChannel = null;
         let textChannel = null;
         let azkarChannel = null;
         if (setupData.categoryId) {
            category =
               guild.channels.cache.get(setupData.categoryId) ||
               (await guild.channels.fetch(setupData.categoryId).catch(() => null));
         }
         if (!category) {
            category = await guild.channels.create({
               name: '🕋︱القُرآن الكريم',
               type: ChannelType.GuildCategory,
               permissionOverwrites: [
                  {
                     id: guild.roles.everyone.id,
                     deny: [PermissionsBitField.Flags.ViewChannel],
                  },
               ],
               reason: 'Recovery from setup guilds',
            });
         }
         if (setupData.voiceChannelId) {
            voiceChannel =
               guild.channels.cache.get(setupData.voiceChannelId) ||
               (await guild.channels.fetch(setupData.voiceChannelId).catch(() => null));
         }
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
                     allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect],
                     deny: [PermissionsBitField.Flags.Speak],
                  },
               ],
               reason: 'Recovery from setup guilds',
            });
         }
         if (setupData.textChannelId) {
            textChannel =
               guild.channels.cache.get(setupData.textChannelId) ||
               (await guild.channels.fetch(setupData.textChannelId).catch(() => null));
         }
         if (!textChannel) {
            textChannel = await guild.channels.create({
               name: '📖︱تحكم البوت القرآني',
               type: ChannelType.GuildText,
               parent: category.id,
               rateLimitPerUser: 0,
               permissionOverwrites: [
                  {
                     id: guild.roles.everyone.id,
                     allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                     deny: [PermissionsBitField.Flags.SendMessages],
                  },
               ],
               reason: 'Recovery from setup guilds',
            });
         }
         if (setupData.azkarChannelId) {
            azkarChannel =
               guild.channels.cache.get(setupData.azkarChannelId) ||
               (await guild.channels.fetch(setupData.azkarChannelId).catch(() => null));
         }
         if (!azkarChannel) {
            azkarChannel = await guild.channels.create({
               name: '🌙︱الأذكار',
               type: ChannelType.GuildText,
               parent: category.id,
               rateLimitPerUser: 0,
               permissionOverwrites: [
                  {
                     id: guild.roles.everyone.id,
                     allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                     deny: [PermissionsBitField.Flags.SendMessages],
                  },
               ],
               reason: 'Recovery from setup guilds',
            });
         }
         global.setupGuilds[guildId] = {
            categoryId: category.id,
            voiceChannelId: voiceChannel.id,
            textChannelId: textChannel.id,
            azkarChannelId: azkarChannel.id,
         };
         const state = getGuildState(guildId);
         state.azkarChannelId = azkarChannel.id;
         startAzkarTimerForGuild(guildId, azkarChannel.id);
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
            content: 'استعادة الإعدادات من',
            embeds: [embed],
            components: components,
         });
         await saveControlId(guildId, textChannel.id, message.id);

         logger.info('Guild' + guildId + ' Recovered Successfully From Setup Guilds');
         return true;
      } catch (error) {
         logger.error('Failed To Recover Guild ' + guild.id);
         return false;
      }
   }

   async recoverFromBackup(client) {
      try {
         logger.info('Starting Recovery From Backup');
         const setupGuilds = await loadSetupGuildsFromFirebase();
         if (!setupGuilds || Object.keys(setupGuilds).length === 0) {
            logger.warn('No Setup Guilds Found In Backup');
            return { success: false, reason: 'No backup data' };
         }

         let recoveredCount = 0;
         let failedCount = 0;

         for (const [guildId, setupData] of Object.entries(setupGuilds)) {
            try {
               const guild = client.guilds.cache.get(guildId);
               if (!guild) {
                  logger.warn('Guild ' + guildId + ' Not Found Skipping Recovery');
                  failedCount++;
                  continue;
               }

               const isRecovered = await this.recoverGuild(guild, setupData);
               if (isRecovered) {
                  recoveredCount++;
               } else {
                  failedCount++;
               }
            } catch (error) {
               logger.error('Failed To Recover Guild ' + guildId);
               failedCount++;
            }
         }

         logger.info('Recovery Complete ' + recoveredCount + ' Recovered ' + failedCount + ' Failed');
         return { success: true, recovered: recoveredCount, failed: failedCount };
      } catch (error) {
         logger.error('Recovery From Backup Failed');
         return { success: false, reason: error.message };
      }
   }
   async recoverGuild(guild, setupData) {
      try {
         const guildId = guild.id;
         let category = null;
         let voiceChannel = null;
         let textChannel = null;
         let azkarChannel = null;

         if (setupData.categoryId) {
            category =
               guild.channels.cache.get(setupData.categoryId) ||
               (await guild.channels.fetch(setupData.categoryId).catch(() => null));
         }
         if (!category) {
            category = await guild.channels.create({
               name: '🕋︱القُرآن الكريم',
               type: ChannelType.GuildCategory,
               permissionOverwrites: [
                  {
                     id: guild.roles.everyone.id,
                     deny: [PermissionsBitField.Flags.ViewChannel],
                  },
               ],
               reason: 'Recovery from backup',
            });
         }
         if (setupData.voiceChannelId) {
            voiceChannel =
               guild.channels.cache.get(setupData.voiceChannelId) ||
               (await guild.channels.fetch(setupData.voiceChannelId).catch(() => null));
         }
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
                     allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect],
                     deny: [PermissionsBitField.Flags.Speak],
                  },
               ],
               reason: 'Recovery from backup',
            });
         }
         if (setupData.textChannelId) {
            textChannel =
               guild.channels.cache.get(setupData.textChannelId) ||
               (await guild.channels.fetch(setupData.textChannelId).catch(() => null));
         }
         if (!textChannel) {
            textChannel = await guild.channels.create({
               name: '📖︱تحكم البوت القرآني',
               type: ChannelType.GuildText,
               parent: category.id,
               rateLimitPerUser: 0,
               permissionOverwrites: [
                  {
                     id: guild.roles.everyone.id,
                     allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                     deny: [PermissionsBitField.Flags.SendMessages],
                  },
               ],
               reason: 'Recovery from backup',
            });
         }
         if (setupData.azkarChannelId) {
            azkarChannel =
               guild.channels.cache.get(setupData.azkarChannelId) ||
               (await guild.channels.fetch(setupData.azkarChannelId).catch(() => null));
         }
         if (!azkarChannel) {
            azkarChannel = await guild.channels.create({
               name: '🌙︱الأذكار',
               type: ChannelType.GuildText,
               parent: category.id,
               rateLimitPerUser: 0,
               permissionOverwrites: [
                  {
                     id: guild.roles.everyone.id,
                     allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                     deny: [PermissionsBitField.Flags.SendMessages],
                  },
               ],
               reason: 'Recovery from backup',
            });
         }
         global.setupGuilds[guildId] = {
            categoryId: category.id,
            voiceChannelId: voiceChannel.id,
            textChannelId: textChannel.id,
            azkarChannelId: azkarChannel.id,
         };
         const state = getGuildState(guildId);
         state.azkarChannelId = azkarChannel.id;
         startAzkarTimerForGuild(guildId, azkarChannel.id);
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
            content: 'تم استعادة',
            embeds: [embed],
            components: components,
         });
         await saveControlId(guildId, textChannel.id, message.id);
         logger.info('Guild ' + guildId + ' Recovered Successfully');
         return true;
      } catch (error) {
         logger.error('Failed To Recover Guild ' + guild.id);
         return false;
      }
   }
   async validateBackup() {
      try {
         const setupGuilds = await loadSetupGuildsFromFirebase();
         if (!setupGuilds || Object.keys(setupGuilds).length === 0) {
            return {
               valid: false,
               reason: 'No setup guilds in backup',
            };
         }
         return { valid: true, count: Object.keys(setupGuilds).length };
      } catch (error) {
         return { valid: false, reason: error.message };
      }
   }
   getBackupInfo() {
      return {
         timestamp: this.backupData.timestamp,
         setupGuildsCount: Object.keys(this.backupData.setupGuilds || {}).length,
         guildStatesCount: Object.keys(this.backupData.guildStates || {}).length,
         controlIdsCount: Object.keys(this.backupData.controlIds || {}).length,
      };
   }
}
const backupManager = new BackupManager();
module.exports.backupManager = backupManager;
