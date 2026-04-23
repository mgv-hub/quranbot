const path = require('path');
const Envira = require('../package/Envira/src/lib/main');
const fs = require('fs');

const baseEnvPath = path.resolve(__dirname, '../../.env');
let baseEnv = {};

if (fs.existsSync(baseEnvPath)) {
   const baseEnvContent = fs.readFileSync(baseEnvPath, 'utf8');
   baseEnv = Envira.parse(baseEnvContent);
}

const currentEnv = baseEnv.NODE_ENV;

const envPath = path.resolve(__dirname, `../../${currentEnv}.env`);

const result = Envira.config({ path: envPath });

if (result.error) {
   console.error(`Could Not Load ${currentEnv} Env File`, result.error.message);
   process.exit(1);
} else {
   console.log(`Loaded ${currentEnv} Env`);
}

if (currentEnv === 'development') {
   if (process.env.TOPGG_TOKEN) {
      delete process.env.TOPGG_TOKEN;
      console.log('Development Mode TOPGG_TOKEN Removed');
   }
}

module.exports.isDevelopment = currentEnv === 'development';
module.exports.isProduction = currentEnv === 'production';
module.exports.currentEnv = currentEnv;
