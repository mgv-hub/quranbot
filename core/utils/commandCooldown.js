require('pathlra-aliaser');
const logger = require('@logger');

const userCooldowns = new Map();
const serverCooldowns = new Map();

const COMMAND_COOLDOWNS = {
   control: { duration: 25000, type: 'user' },
   guide: { duration: 15000, type: 'user' },
   join_channel: { duration: 15000, type: 'user' },
   join: { duration: 15000, type: 'user' },
   leave: { duration: 15000, type: 'user' },
   ping: { duration: 30000, type: 'user' },
   prayerTimes: { duration: 50000, type: 'user' },
   setup: { duration: 60000, type: 'server' },
   sources: { duration: 10000, type: 'user' },
};

const COMMAND_NAME_MAP = {
   تحكم: 'control',
   دليل: 'guide',
   دخول_قناة: 'join_channel',
   دخول: 'join',
   خروج: 'leave',
   سرعة: 'ping',
   مواقيت_الصلاة: 'prayerTimes',
   إعداد: 'setup',
   مصادر: 'sources',
};

function getCommandKey(commandName) {
   return COMMAND_NAME_MAP[commandName] || commandName;
}

function checkUserCooldown(userId, commandName) {
   const commandKey = getCommandKey(commandName);
   const config = COMMAND_COOLDOWNS[commandKey];

   if (!config || config.type !== 'user') {
      return { allowed: true, remaining: 0 };
   }

   const cooldownKey = `${userId}:${commandKey}`;
   const cooldownData = userCooldowns.get(cooldownKey);

   if (!cooldownData) {
      return { allowed: true, remaining: 0 };
   }

   const now = Date.now();
   const elapsed = now - cooldownData.timestamp;

   if (elapsed < config.duration) {
      const remaining = Math.ceil((config.duration - elapsed) / 1000);
      return { allowed: false, remaining, duration: config.duration / 1000 };
   }

   userCooldowns.delete(cooldownKey);
   return { allowed: true, remaining: 0 };
}

function setUserCooldown(userId, commandName) {
   const commandKey = getCommandKey(commandName);
   const config = COMMAND_COOLDOWNS[commandKey];

   if (!config || config.type !== 'user') {
      return;
   }

   const cooldownKey = `${userId}:${commandKey}`;
   userCooldowns.set(cooldownKey, {
      timestamp: Date.now(),
      command: commandKey,
      userId: userId,
   });

   logger.debug(`User cooldown set for ${userId} on command ${commandKey}`);
}

function checkServerCooldown(guildId, commandName) {
   const commandKey = getCommandKey(commandName);
   const config = COMMAND_COOLDOWNS[commandKey];

   if (!config || config.type !== 'server') {
      return { allowed: true, remaining: 0 };
   }

   const cooldownKey = `${guildId}:${commandKey}`;
   const cooldownData = serverCooldowns.get(cooldownKey);

   if (!cooldownData) {
      return { allowed: true, remaining: 0 };
   }

   const now = Date.now();
   const elapsed = now - cooldownData.timestamp;

   if (elapsed < config.duration) {
      const remaining = Math.ceil((config.duration - elapsed) / 1000);
      return { allowed: false, remaining, duration: config.duration / 1000 };
   }

   serverCooldowns.delete(cooldownKey);
   return { allowed: true, remaining: 0 };
}

function setServerCooldown(guildId, commandName) {
   const commandKey = getCommandKey(commandName);
   const config = COMMAND_COOLDOWNS[commandKey];

   if (!config || config.type !== 'server') {
      return;
   }

   const cooldownKey = `${guildId}:${commandKey}`;
   serverCooldowns.set(cooldownKey, {
      timestamp: Date.now(),
      command: commandKey,
      guildId: guildId,
   });

   logger.debug(`Server cooldown set for ${guildId} on command ${commandKey}`);
}

function checkCooldown(userId, guildId, commandName) {
   const commandKey = getCommandKey(commandName);
   const config = COMMAND_COOLDOWNS[commandKey];

   if (!config) {
      return { allowed: true, remaining: 0, type: 'none' };
   }

   if (config.type === 'server') {
      const result = checkServerCooldown(guildId, commandKey);
      return {
         allowed: result.allowed,
         remaining: result.remaining,
         duration: result.duration,
         type: 'server',
      };
   } else {
      const result = checkUserCooldown(userId, commandKey);
      return {
         allowed: result.allowed,
         remaining: result.remaining,
         duration: result.duration,
         type: 'user',
      };
   }
}

function setCooldown(userId, guildId, commandName) {
   const commandKey = getCommandKey(commandName);
   const config = COMMAND_COOLDOWNS[commandKey];

   if (!config) {
      return;
   }

   if (config.type === 'server') {
      setServerCooldown(guildId, commandKey);
   } else {
      setUserCooldown(userId, commandKey);
   }
}

function getUserCooldownMessage(remaining) {
   return `يجب الانتظار ${remaining} ثانية قبل استخدام هذا الأمر مرة أخرى`;
}

function getServerCooldownMessage(remaining) {
   return `هذا الأمر في مهلة انتظار على السيرفر. الرجاء الانتظار ${remaining} ثانية قبل استخدامه مرة أخرى`;
}

function getCooldownResponse(remaining, type) {
   if (type === 'server') {
      return getServerCooldownMessage(remaining);
   } else {
      return getUserCooldownMessage(remaining);
   }
}

function clearUserCooldown(userId, commandName) {
   const commandKey = getCommandKey(commandName);
   const cooldownKey = `${userId}:${commandKey}`;
   userCooldowns.delete(cooldownKey);
}

function clearServerCooldown(guildId, commandName) {
   const commandKey = getCommandKey(commandName);
   const cooldownKey = `${guildId}:${commandKey}`;
   serverCooldowns.delete(cooldownKey);
}

function clearAllCooldowns() {
   userCooldowns.clear();
   serverCooldowns.clear();
   logger.info('All cooldowns cleared');
}

function getCooldownStats() {
   return {
      userCooldowns: userCooldowns.size,
      serverCooldowns: serverCooldowns.size,
   };
}

setInterval(() => {
   const now = Date.now();

   for (const [key, data] of userCooldowns.entries()) {
      const config = COMMAND_COOLDOWNS[data.command];
      if (config && now - data.timestamp > config.duration) {
         userCooldowns.delete(key);
      }
   }

   for (const [key, data] of serverCooldowns.entries()) {
      const config = COMMAND_COOLDOWNS[data.command];
      if (config && now - data.timestamp > config.duration) {
         serverCooldowns.delete(key);
      }
   }
}, 60000);

module.exports = {
   checkUserCooldown,
   setUserCooldown,
   checkServerCooldown,
   setServerCooldown,
   checkCooldown,
   setCooldown,
   getCooldownResponse,
   getUserCooldownMessage,
   getServerCooldownMessage,
   clearUserCooldown,
   clearServerCooldown,
   clearAllCooldowns,
   getCooldownStats,
   COMMAND_COOLDOWNS,
   COMMAND_NAME_MAP,
};
