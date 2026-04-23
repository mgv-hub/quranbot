const { createClient } = require('redis');
const logger = require('@logger');

class SharedStateManager {
   constructor() {
      this.client = createClient({ url: process.env.REDIS_URL });
      this.client.on('error', (err) => logger.error('Redis Client Error', err));
      this.client.connect().catch((err) => logger.error('Redis connection failed', err));
   }

   async setGuildState(guildId, state) {
      const safeState = {
         currentSurah: state.currentSurah,
         currentReciter: state.currentReciter,
         playbackMode: state.playbackMode,
         currentRadioUrl: state.currentRadioUrl,
         controlMode: state.controlMode,
         isPaused: state.isPaused,
         pauseReason: state.pauseReason,
         channelId: state.channelId,
      };
      await this.client.set(`guild_state:${guildId}`, JSON.stringify(safeState), {
         EX: 86400,
      });
   }

   async getGuildState(guildId) {
      const data = await this.client.get(`guild_state:${guildId}`);
      return data ? JSON.parse(data) : null;
   }

   async incrementGuildCount() {
      return await this.client.incr('global_guild_count');
   }

   async decrementGuildCount() {
      return await this.client.decr('global_guild_count');
   }

   async getGlobalGuildCount() {
      const count = await this.client.get('global_guild_count');
      return count ? parseInt(count) : 0;
   }

   async broadcastMessage(channel, message) {
      await this.client.publish(channel, JSON.stringify(message));
   }

   async subscribe(channel, callback) {
      const subscriber = createClient({ url: process.env.REDIS_URL });
      await subscriber.connect();
      await subscriber.subscribe(channel, (message) => {
         try {
            callback(JSON.parse(message));
         } catch (e) {
            callback(message);
         }
      });
      return subscriber;
   }
}

module.exports = new SharedStateManager();
