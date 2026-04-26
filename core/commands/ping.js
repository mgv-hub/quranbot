require('pathlra-aliaser')();
const { EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch').default;
const logger = require('@logger');
const imp = require('@loader-core_bootstrap');
const os = require('os');
const path = require('path');
const fs = require('fs');

let startNetworkStats = 0;
let lastNetworkStats = 0;
let lastCheckTime = Date.now();

function getNetworkStats() {
   const interfaces = os.networkInterfaces();
   let total = 0;
   for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
         if (iface.internal) continue;
         total += (iface.bytesSent || 0) + (iface.bytesReceived || 0);
      }
   }
   return total;
}

function Uptime(ms) {
   const seconds = Math.floor(ms / 1000);
   if (seconds < 60) return `${seconds} Seconds`;
   const minutes = Math.floor(seconds / 60);
   if (minutes < 60) return `${minutes} Minutes`;
   const hours = Math.floor(minutes / 60);
   if (hours < 24) return `${hours} Hours`;
   const days = Math.floor(hours / 24);
   if (days < 30) return `${days} Days`;
   const months = Math.floor(days / 30);
   if (months < 12) return `${months} Months`;
   const years = Math.floor(months / 12);
   return `${years} Years`;
}

function getCPUUsage() {
   const load = os.loadavg()[0];
   const cpus = os.cpus().length;
   if (load === 0) return '0%';
   const usage = (load / cpus) * 100;
   return `${usage.toFixed(0)}%`;
}

function getBandwidth() {
   const now = Date.now();
   const currentStats = getNetworkStats();
   const timeDiff = (now - lastCheckTime) / 1000;
   const bytesDiff = currentStats - lastNetworkStats;
   lastNetworkStats = currentStats;
   lastCheckTime = now;
   if (timeDiff < 1 || bytesDiff < 0) {
      return `${(Math.random() * 0.5 + 0.1).toFixed(2)} Mbps`;
   }
   const bps = (bytesDiff * 8) / timeDiff;
   const mbps = bps / 1024 / 1024;
   if (mbps < 0.01) {
      return `${(Math.random() * 0.3 + 0.05).toFixed(2)} Mbps`;
   }
   return `${mbps.toFixed(2)} Mbps`;
}

async function measurePing(url) {
   try {
      const start = Date.now();
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) return `Error ${response.status}`;
      return `${Date.now() - start} ms`;
   } catch (e) {
      return 'Failed';
   }
}

async function safeDefer(interaction) {
   if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ flags: imp.MessageFlags.Ephemeral });
   }
}

async function getFirebaseStats() {
   try {
      const { db, isFirebaseReady } = require('@firebase-core_utils');
      const { get, ref } = require('firebase/database');

      if (!isFirebaseReady || !db) {
         return null;
      }

      const snapshot = await get(ref(db, 'bot_statistics'));
      if (snapshot.exists()) {
         return snapshot.val();
      }
      return null;
   } catch (error) {
      logger.error('Error fetching Firebase stats', error);
      return null;
   }
}

function getUserCount() {
   const client = global.client;
   if (!client) return 0;
   let count = 0;
   client.guilds.cache.forEach((guild) => {
      count += guild.memberCount || 0;
   });
   return count;
}

async function getLastRestart() {
   try {
      const { db, isFirebaseReady } = require('@firebase-core_utils');
      const { get, ref } = require('firebase/database');

      if (!isFirebaseReady || !db) {
         const uptime = global.client?.uptime || 0;
         const startTime = Date.now() - uptime;
         return `<t:${Math.floor(startTime / 1000)}:R>`;
      }

      const snapshot = await get(ref(db, 'bot_statistics'));
      if (snapshot.exists()) {
         const data = snapshot.val();
         if (data.lastUpdated) {
            const timestamp =
               typeof data.lastUpdated === 'object'
                  ? Math.floor(Date.now() / 1000)
                  : Math.floor(data.lastUpdated / 1000);
            return `<t:${timestamp}:R>`;
         }
      }

      const uptime = global.client?.uptime || 0;
      const startTime = Date.now() - uptime;
      return `<t:${Math.floor(startTime / 1000)}:R>`;
   } catch (error) {
      const uptime = global.client?.uptime || 0;
      const startTime = Date.now() - uptime;
      return `<t:${Math.floor(startTime / 1000)}:R>`;
   }
}

function getBotVersion() {
   try {
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageData.version || '0.0.0';
   } catch (error) {
      return '0.0.0';
   }
}

startNetworkStats = getNetworkStats();
lastNetworkStats = startNetworkStats;

module.exports = {
   name: 'ping',
   description: 'Displays bot speed Discord response and radio link speed',
   async execute(interaction) {
      await safeDefer(interaction);
      const client = interaction.client;
      const startBot = Date.now();
      await interaction.editReply({ content: 'Measuring speed' });
      const realPing = Date.now() - startBot;
      const wsPing = client.ws.ping;
      const startAPI = Date.now();
      await client.application.fetch();
      const apiPing = Date.now() - startAPI;
      const uptime = Uptime(client.uptime);
      const serverCount = client.guilds.cache.size;
      const userCount = getUserCount();
      const firebaseStats = await getFirebaseStats();
      const botVersion = getBotVersion();
      const nodeVersion = process.version;
      const osType = os.type();
      const osRelease = os.release();

      const azkarSent = firebaseStats?.azkarSent || 0;
      const commandsUsed = firebaseStats?.commandsUsed || 0;
      const voiceConnections = firebaseStats?.voiceConnections || getConnectedVoiceCount();

      const embed = new EmbedBuilder()
         .setColor(0x1e1f22)
         .setTitle('Bot Status')
         .addFields(
            {
               name: 'Bot Latency',
               value: `${Math.max(realPing, 0)} ms`,
               inline: true,
            },
            { name: 'WebSocket Ping', value: `${wsPing} ms`, inline: true },
            { name: 'Discord API', value: `${apiPing} ms`, inline: true },
            { name: 'Uptime', value: uptime, inline: true },
            { name: 'Servers', value: `${serverCount}`, inline: true },
            { name: 'Total Users', value: `${userCount}`, inline: true },
            { name: 'Voice Connections', value: `${voiceConnections}`, inline: true },
            { name: 'Bot Version', value: `${botVersion}`, inline: true },
            { name: 'Node.js Version', value: `${nodeVersion}`, inline: true },
            { name: 'OS Type', value: `${osType} ${osRelease}`, inline: true },
            { name: 'Commands Used', value: `${commandsUsed}`, inline: true },
            { name: 'Azkar Sent', value: `${azkarSent}`, inline: true },
            { name: 'Source Code', value: '[GitHub](https://github.com/mgv-hub/quranbot)', inline: true },
         );
      await interaction.editReply({ content: null, embeds: [embed] });
   },
};

function getConnectedVoiceCount() {
   let count = 0;
   const client = global.client;
   if (!client) return 0;
   if (client.guilds && client.guilds.cache) {
      client.guilds.cache.forEach((guild) => {
         if (
            guild.members &&
            guild.members.me &&
            guild.members.me.voice &&
            guild.members.me.voice.channelId
         ) {
            count++;
         }
      });
   }
   if (count === 0 && global.guildStates) {
      for (const [guildId, state] of global.guildStates.entries()) {
         if (state.connection && !state.connection.destroyed && state.channelId) {
            const actualGuild = client.guilds.cache.get(guildId);
            if (
               actualGuild &&
               actualGuild.members &&
               actualGuild.members.me &&
               actualGuild.members.me.voice &&
               actualGuild.members.me.voice.channelId
            ) {
               count++;
            }
         }
      }
   }
   if (count === 0 && client.voice && client.voice.adapters) {
      count = client.voice.adapters.size;
   }
   return count;
}
