require('../package/Envira/src/lib/main');
require('pathlra-aliaser')();
const fs = require('fs').promises;
const pathlra = require('path');
const { Mutex } = require('async-mutex');
const logger = require('@logger');
require('@cooldown-core_state');
const { getBrowserHeaders, getTimeoutForRequest } = require('@httpConfig-core_utils');
global.logger = logger;
let surahNames;
let azkarData;
const mutex = new Mutex();

const {
   validateUrl,
   createSurahResource,
   getCurrentLinks,
   getCurrentDurations,
   createReciterRow,
   createControlModeRow,
   getGuildState,
   removeGuildState,
   createControlEmbed,
   createSelectRow,
   createButtonRow,
   createNavigationRow,
   sendRandomAzkar,
   startAzkarTimerForGuild,
   registerCommands,
   isAuthorized,
   setupQuranCategory,
   checkCooldown,
   applyCommandPermissions,
   checkRateLimit,
   checkVoiceCooldown,
   createRadioRow,
   createRadioResource,
} = require('@core-utils-core_utils');

const { loadData, saveSetupGuilds } = require('@data-manager-core_data');
const { Client, GatewayIntentBits, REST } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID || token?.split('.')[0];
const specialUserIds = process.env.SPE_USER_ID || '0';

global.SPE_USER_IDS = specialUserIds
   .split(',')
   .map((id) => id.trim())
   .filter((id) => id.length > 0);
global.SPE_USER_ID = global.SPE_USER_IDS[0] || '0';

if (!token) {
   logger.error('Fatal Discord Token Not Found In Env File');
   process.exit(1);
}

global.token = token;
global.clientId = clientId;
global.joinVoiceChannel = joinVoiceChannel;
global.createSurahResource = createSurahResource;
global.quranRadios = [];

let i = 1;
while (process.env['QURAN_RADIO_' + i + '_NAME'] && process.env['QURAN_RADIO_' + i + '_URL']) {
   const name = process.env['QURAN_RADIO_' + i + '_NAME'].trim();
   const url = process.env['QURAN_RADIO_' + i + '_URL'].trim().replace(/\s+$/, '');
   if (name && url) global.quranRadios.push({ name, url });
   i++;
}

global.radioPages = [];
const ITEMS_PER_PAGE = 25;
for (let page = 0; page < Math.ceil(global.quranRadios.length / ITEMS_PER_PAGE); page++) {
   const start = page * ITEMS_PER_PAGE;
   const end = Math.min(start + ITEMS_PER_PAGE, global.quranRadios.length);
   global.radioPages.push(global.quranRadios.slice(start, end));
}

logger.info('Loaded ' + global.quranRadios.length + ' Quran Radios From Env Variables');

logger.info('Current Date In Cairo ' + new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' }));

const client = new Client({
   intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildVoiceStates,
   ],
});

global.client = client;
global.guildStates = new Map();
global.cooldowns = new Map();
global.commandCooldowns = new Map();
global.azkarData = [];

(async () => {
   try {
      const response = await fetch('https://hub-mgv.github.io/QuranBotData/adhkar.json', {
         headers: getBrowserHeaders(),
         timeout: getTimeoutForRequest('default'),
      });
      if (response.ok) {
         global.azkarData = await response.json();
         logger.info('Loaded ' + global.azkarData.length + ' Adhkar Categories From New adhkar.json');
         let totalAdhkar = 0;
         global.azkarData.forEach((cat) => {
            if (cat.array && Array.isArray(cat.array)) {
               totalAdhkar += cat.array.length;
            }
         });
         logger.info('Total adhkar entries: ' + totalAdhkar);
      } else {
         throw new Error('HTTP ' + response.status);
      }
   } catch (error) {
      logger.warn('Failed To Load New Adhkar Data From adhkar.json Using Minimal Fallback');
      global.azkarData = [
         {
            id: 1,
            category: 'تسبيح',
            audio: '/audio/ar_7esn_AlMoslem_by_Doors_028.mp3',
            filename: 'ar_7esn_AlMoslem_by_Doors_028',
            array: [
               {
                  text: 'سبحان الله وبحمده',
                  count: 100,
                  audio: '/audio/91.mp3',
                  filename: '91',
               },
               {
                  text: 'الحمد لله',
                  count: 100,
                  audio: '/audio/92.mp3',
                  filename: '92',
               },
               {
                  text: 'الله أكبر',
                  count: 100,
                  audio: '/audio/93.mp3',
                  filename: '93',
               },
            ],
         },
      ];
   }
})();

const rest = new REST({ version: '10' }).setToken(token);
global.rest = rest;

process.on('warning', (warning) => {
   logger.warn('Node Js Warning ' + warning.name + ' ' + warning.message);
});

setInterval(() => {
   const memoryUsage = process.memoryUsage();
   const mbUsed = memoryUsage.heapUsed / 1024 / 1024;
   if (mbUsed > 300) {
      logger.warn('Detected Cache:' + mbUsed.toFixed(2) + ' MB');
      Object.keys(require.cache).forEach((key) => {
         if (key.includes('temp') || key.includes('cache')) delete require.cache[key];
      });
   }
}, 60000);

const runtimeStates = require('@RuntimeState-core_runtime');
const { saveRuntimeStates, restoreRuntimeStates, loadRuntimeStates } = runtimeStates;
global.saveRuntimeStates = saveRuntimeStates;
module.exports.client = client;
module.exports.surahNames = surahNames;
module.exports.azkarData = azkarData;
module.exports.setupGuilds = null;
module.exports.mutex = mutex;
module.exports.saveRuntimeStates = saveRuntimeStates;
module.exports.restoreRuntimeStates = restoreRuntimeStates;
module.exports.loadRuntimeStates = loadRuntimeStates;
