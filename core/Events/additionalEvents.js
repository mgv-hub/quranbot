require('pathlra-aliaser')();
const logger = require('@logger');
const { removeGuildState, applyCommandPermissions } = require('@core-utils-core_utils');
const { ChannelType } = require('discord.js');
const client = require('@botSetup').client;
const http = require('http');

client.on('guildCreate', async (guild) => {
   logger.info('Bot Joined New Guild ' + guild.name + ' ' + guild.id);
   try {
      const owner = await guild.fetchOwner();
      const channel = guild.channels.cache.find(
         (c) => c.type === ChannelType.GuildText && c.permissionsFor(client.user).has('CreateInstantInvite'),
      );
      if (!channel) {
         logger.warn('No Suitable Text Channel Found In Guild ' + guild.id);
         return;
      }
      const invite = await channel.createInvite({
         maxAge: 0,
         maxUses: 0,
         unique: true,
         reason: 'Permanent invite for tracking',
      });
      logger.info('Tracked New Guild ' + guild.id + ' With Invite ' + invite.url);
   } catch (error) {
      logger.error('Error Tracking Guild ' + guild.id);
   }
   await applyCommandPermissions(guild);
});

client.on('guildDelete', (guild) => {
   removeGuildState(guild.id);
   logger.info('Cleaned Up State For Deleted Guild ' + guild.id);
});

let healthServerStarted = false;
const server = http.createServer((req, res) => {
   if (req.url === '/health') {
      try {
         const voiceCount = getConnectedVoiceCount();
         const uptime = process.uptime();
         const memory = process.memoryUsage();
         res.writeHead(200, { 'Content-Type': 'application/json' });
         res.end(
            JSON.stringify({
               status: 'ok',
               voiceConnections: voiceCount,
               uptime: uptime,
               memory: {
                  rss: memory.rss,
                  heapTotal: memory.heapTotal,
                  heapUsed: memory.heapUsed,
               },
               timestamp: new Date(),
            }),
         );
      } catch (error) {
         res.writeHead(500);
         res.end(JSON.stringify({ status: 'error', message: error.message }));
      }
   } else {
      res.writeHead(404);
      res.end();
   }
});
const port = process.env.HH_CH_PORT;
if (!healthServerStarted) {
   server
      .listen(port, () => {
         logger.info('Health Check Server Running On Port ' + port);
      })
      .on('error', (err) => {
         if (err.code === 'EADDRINUSE') {
            logger.warn('Port ' + port + ' Already In Use Skipping Health Server');
         } else {
            logger.error('Health Server Error', err);
         }
      });
   healthServerStarted = true;
}

function getConnectedVoiceCount() {
   if (!global.guildStates) return 0;
   let count = 0;
   for (const state of global.guildStates.values()) {
      if (state.connection && !state.connection.destroyed && state.channelId) {
         count++;
      }
   }
   return count;
}

require('@globalAll');
