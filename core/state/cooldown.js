require('pathlra-aliaser');
const logger = require('@logger');

const COOLDOWN_TYPES = {
   COMMAND: 'command',
   VOICE: 'voice',
   RATE_LIMIT: 'rate_limit',
};

const globalCooldowns = new Map();
const rateLimitTracker = new Map();

function isUserInGlobalCooldown(userId) {
   if (!globalCooldowns) return false;

   const userCooldown = globalCooldowns.get(userId);
   if (userCooldown && Date.now() < userCooldown.end) {
      return true;
   }

   return false;
}

function setGlobalCooldown(userId, duration) {
   const cooldown = {
      start: Date.now(),
      end: Date.now() + duration,
      remaining: Math.floor(duration / 1000),
   };

   globalCooldowns.set(userId, cooldown);

   setTimeout(() => {
      globalCooldowns.delete(userId);
   }, duration);

   return cooldown;
}

function registerViolation(userId, reason) {
   logger.warn(`Violation registered for user ${userId}: ${reason}`);
}

function checkCooldown(userId, type = COOLDOWN_TYPES.COMMAND, key = null) {
   const identifier = key ? `${userId}:${key}` : userId;

   return {
      valid: true,
      message: '',
   };
}

function checkRateLimit(userId, guildId, maxActions = 100, windowMs = 60000) {
   const now = Date.now();
   const key = `${userId}:${guildId}`;

   if (!rateLimitTracker.has(key)) {
      rateLimitTracker.set(key, {
         count: 1,
         windowStart: now,
      });
      return { valid: true, count: 1, limit: maxActions };
   }

   const tracker = rateLimitTracker.get(key);

   if (now - tracker.windowStart > windowMs) {
      tracker.count = 1;
      tracker.windowStart = now;
      return { valid: true, count: 1, limit: maxActions };
   }

   tracker.count++;

   if (tracker.count > maxActions) {
      return {
         valid: false,
         count: tracker.count,
         limit: maxActions,
         message: `تم تجاوز حد الاستخدام المسموح. يرجى الانتظار ${Math.ceil((windowMs - (now - tracker.windowStart)) / 1000)} ثانية`,
      };
   }

   return { valid: true, count: tracker.count, limit: maxActions };
}

async function init() {
   logger.info('Cooldown System Initialized');

   setInterval(() => {
      const now = Date.now();

      for (const [userId, cooldown] of globalCooldowns.entries()) {
         if (now > cooldown.end) {
            globalCooldowns.delete(userId);
         }
      }

      for (const [key, tracker] of rateLimitTracker.entries()) {
         if (now - tracker.windowStart > 60000) {
            rateLimitTracker.delete(key);
         }
      }
   }, 30000);
}

global.isUserInGlobalCooldown = isUserInGlobalCooldown;
global.setGlobalCooldown = setGlobalCooldown;
global.registerViolation = registerViolation;
global.checkCooldown = checkCooldown;
global.checkRateLimit = checkRateLimit;
global.COOLDOWN_TYPES = COOLDOWN_TYPES;

module.exports.init = init;
module.exports.isUserInGlobalCooldown = isUserInGlobalCooldown;
module.exports.setGlobalCooldown = setGlobalCooldown;
module.exports.registerViolation = registerViolation;
module.exports.checkCooldown = checkCooldown;
module.exports.checkRateLimit = checkRateLimit;
module.exports.COOLDOWN_TYPES = COOLDOWN_TYPES;

init().catch(logger.error);
