require('../config/envSwitcher.js');
require('pathlra-aliaser')();
require('@botSetup');
require('@radioHealthChecker-core_utils');
require('@voiceHandlers');
require('@voiceStateHandler-core_events');
require('@interactionHandler');
require('@readyHandler');
require('@additionalevents');
require('@ping-core_commands');
require('@guild-tracker');
require('@topgg-core_web');
require('@globalAll');
const { ActivityType } = require('discord.js');
const { client, logger } = global;
let activityIndex = 0;

function getCairoHour() {
   const now = new Date();
   return (now.getUTCHours() + 2) % 24;
}

function getCairoMinutes() {
   const now = new Date();
   return now.getUTCMinutes();
}

function getConnectedVoiceCount() {
   let count = 0;
   client.guilds.cache.forEach((guild) => {
      if (guild.members.me?.voice?.channelId) {
         count++;
      }
   });
   if (count === 0 && global.guildStates) {
      for (const [guildId, state] of global.guildStates.entries()) {
         if (state.connection && !state.connection.destroyed && state.channelId) {
            const actualGuild = client.guilds.cache.get(guildId);
            if (actualGuild?.members.me?.voice?.channelId) {
               count++;
            }
         }
      }
   }
   if (count === 0 && client.voice?.adapters) {
      count = client.voice.adapters.size;
   }
   return count;
}

function getTotalListeners() {
   let totalListeners = 0;
   client.guilds.cache.forEach((guild) => {
      const voiceChannel = guild.members.me?.voice?.channel;
      if (voiceChannel && voiceChannel.members) {
         const listeners = voiceChannel.members.filter((m) => !m.user.bot).size;
         totalListeners += listeners;
      }
   });
   return totalListeners;
}

async function updateStatus() {
   const hour = getCairoHour();
   const guildCount = client.guilds.cache.size;
   const voiceCount = getConnectedVoiceCount();
   const listenerCount = getTotalListeners();
   let status;
   let activity;
   if (activityIndex % 3 === 0) {
      activity = {
         name: 'صلِّ على النبي ﷺ',
         type: ActivityType.Watching,
      };
   } else if (activityIndex % 3 === 1) {
      activity = {
         name: `${guildCount} servers | ${voiceCount} Voice | ${listenerCount} Listeners`,
         type: ActivityType.Watching,
      };
   } else {
      activity = {
         name: 'مفتوح المصدر | github.com/hub-mgv/quranbot',
         type: ActivityType.Watching,
      };
   }
   status = hour >= 6 && hour < 12 ? 'online' : hour >= 12 && hour < 18 ? 'idle' : 'dnd';
   client.user?.setPresence({ status, activities: [activity] });
   activityIndex++;
}

client.once('clientReady', () => {
   const guildCount = client.guilds.cache.size;
   const voiceCount = getConnectedVoiceCount();
   logger.info(`Serving ${guildCount} servers`);
   logger.info(`Connected to ${voiceCount} voice channels`);
   updateStatus();
   setInterval(updateStatus, 30000);
});

const shutdownSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP'];
shutdownSignals.forEach((sig) => {
   process.on(sig, () => {
      logger.warn(`Received ${sig}`);
      process.exit(0);
   });
});

process.on('uncaughtException', (err) => {
   logger.error('Uncaught Exception', err);
   try {
      if (client?.user) {
         const guildCount = client.guilds.cache.size;
         const voiceCount = getConnectedVoiceCount();
         const listenerCount = getTotalListeners();
         client.user.setPresence({
            status: 'dnd',
            activities: [
               {
                  name: `${guildCount} servers | ${voiceCount} Voice | ${listenerCount} Listeners`,
                  type: ActivityType.Watching,
               },
            ],
         });
      }
   } catch {}
});

setInterval(() => {
   const memoryUsage = process.memoryUsage();
   const mbUsed = memoryUsage.heapUsed / 1024 / 1024;
   const mbRss = memoryUsage.rss / 1024 / 1024;
   logger.info(
      'Memory Check RSS ' + mbRss.toFixed(2) + ' MB Heap ' + mbUsed.toFixed(2) + ' MB',
   );
   if (mbUsed > 2000) {
      logger.warn('Critical Memory Usage Triggering GC');
      if (global.gc) {
         global.gc();
      }
   }
}, 60000);

process.on('warning', (warning) => {
   if (warning.code === 'EAGAIN') {
      logger.error('EAGAIN Warning Detected System Resource Exhaustion');
      if (global.gc) {
         global.gc();
      }
   }
});

logger.info('Bot initialized');