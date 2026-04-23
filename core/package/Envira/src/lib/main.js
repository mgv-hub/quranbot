#!/usr/bin/env node

/*
 * NOTICE This library is not an official component or proprietary code of the project
 * It serves as a custom alternative to the Dotenv library
 * It is tailored specifically to meet the requirements of the quranbot project
 * Ownership of this code does not reside with the project entity
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DotenvX {
   constructor(options = {}) {
      this.processEnv = options.processEnv || process.env;
      this.overload = options.overload || options.override || false;
      this.strict = options.strict || false;
      this.ignore = options.ignore || [];
      this.envKeysFile = options.envKeysFile || null;
      this.opsOn = options.opsOff !== true;
      this.privateKey = options.privateKey || null;
   }

   load(options = {}) {
      if (options.path && !options.envFile) {
         options.envFile = Array.isArray(options.path) ? options.path : [options.path];
      }

      const envFiles = options.envFile || ['.env'];
      const envVaultFiles = options.envVaultFile || [];
      const envStrings = options.env || [];
      const DOTENV_KEY = options.DOTENV_KEY || process.env.DOTENV_KEY;
      const convention = options.convention || null;

      const parsedAll = {};
      const errors = [];

      if (convention) {
         const conventionFiles = this.getConventionFiles(convention);
         envFiles.unshift(...conventionFiles);
      }

      for (const envString of envStrings) {
         const parsed = this.parseEnvString(envString);
         Object.assign(parsedAll, parsed);
      }

      for (const envFile of envFiles) {
         const filepath = path.resolve(envFile);
         if (!fs.existsSync(filepath)) {
            if (!this.ignore.includes('MISSING_ENV_FILE')) {
               errors.push({ code: 'MISSING_ENV_FILE', message: `Missing env file: ${filepath}` });
            }
            continue;
         }

         const content = fs.readFileSync(filepath, 'utf8');
         const parsed = this.parse(content, { privateKey: this.privateKey, overload: this.overload });
         Object.assign(parsedAll, parsed);
      }

      for (const envVaultFile of envVaultFiles) {
         const filepath = path.resolve(envVaultFile);
         if (!fs.existsSync(filepath)) {
            if (!this.ignore.includes('MISSING_ENV_VAULT_FILE')) {
               errors.push({
                  code: 'MISSING_ENV_VAULT_FILE',
                  message: `Missing env vault file: ${filepath}`,
               });
            }
            continue;
         }

         const content = fs.readFileSync(filepath, 'utf8');
         const parsed = this.parseVault(content, DOTENV_KEY);
         Object.assign(parsedAll, parsed);
      }

      for (const [key, value] of Object.entries(parsedAll)) {
         if (!(key in this.processEnv) || this.overload) {
            this.processEnv[key] = value;
         }
      }

      if (this.strict && errors.length > 0) {
         throw errors[0];
      }

      return { parsed: parsedAll, errors };
   }

   parse(src, options = {}) {
      const privateKey = options.privateKey || this.privateKey;
      const overload = options.overload || this.overload;
      const parsed = {};

      if (!src || typeof src !== 'string') {
         return parsed;
      }

      const lines = src.split(/\r?\n/);
      for (const line of lines) {
         if (line.trim() === '' || line.trim().startsWith('#')) {
            continue;
         }

         const match = line.match(/^([^=]+)=(.*)$/);
         if (!match) {
            continue;
         }

         const key = match[1].trim();
         let value = match[2].trim();
         value = value.split('#')[0].trim();

         if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
         }

         if (value.startsWith('encrypted:')) {
            if (privateKey) {
               value = this.decrypt(value, privateKey);
            }
         }

         if (!(key in this.processEnv) || overload) {
            parsed[key] = value;
         } else {
            parsed[key] = this.processEnv[key];
         }
      }

      return parsed;
   }

   parseVault(src, DOTENV_KEY) {
      const parsed = {};

      if (!src || typeof src !== 'string') {
         return parsed;
      }

      if (!DOTENV_KEY) {
         return parsed;
      }

      const lines = src.split(/\r?\n/);
      for (const line of lines) {
         if (line.trim() === '' || line.trim().startsWith('#')) {
            continue;
         }

         const match = line.match(/^([^=]+)=(.*)$/);
         if (!match) {
            continue;
         }

         const key = match[1].trim();
         let value = match[2].trim();

         if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
         }

         if (value.startsWith('encrypted:')) {
            value = this.decrypt(value, DOTENV_KEY);
         }

         parsed[key] = value;
      }

      return parsed;
   }

   parseEnvString(envString) {
      const parsed = {};
      const match = envString.match(/^([^=]+)=(.*)$/);
      if (match) {
         const key = match[1].trim();
         let value = match[2].trim();
         if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
         }
         parsed[key] = value;
      }
      return parsed;
   }

   get(key, options = {}) {
      if (options.path && !options.envFile) {
         options.envFile = Array.isArray(options.path) ? options.path : [options.path];
      }

      const envFiles = options.envFile || ['.env'];
      const envStrings = options.env || [];
      const DOTENV_KEY = options.DOTENV_KEY || process.env.DOTENV_KEY;
      const all = options.all || false;

      const parsedAll = {};

      for (const envString of envStrings) {
         const parsed = this.parseEnvString(envString);
         Object.assign(parsedAll, parsed);
      }

      for (const envFile of envFiles) {
         const filepath = path.resolve(envFile);
         if (!fs.existsSync(filepath)) {
            continue;
         }

         const content = fs.readFileSync(filepath, 'utf8');
         const parsed = this.parse(content, { privateKey: this.privateKey, overload: this.overload });
         Object.assign(parsedAll, parsed);
      }

      if (all) {
         Object.assign(parsedAll, process.env);
      }

      if (key) {
         return parsedAll[key];
      }

      if (options.format === 'eval') {
         let inline = '';
         for (const [k, value] of Object.entries(parsedAll)) {
            inline += `${k}=${this.escape(value)}\n`;
         }
         return inline.trim();
      } else if (options.format === 'shell') {
         let inline = '';
         for (const [k, value] of Object.entries(parsedAll)) {
            inline += `${k}=${value} `;
         }
         return inline.trim();
      }

      return parsedAll;
   }

   set(key, value, options = {}) {
      if (options.path && !options.envFile) {
         options.envFile = Array.isArray(options.path) ? options.path : [options.path];
      }

      const envFiles = options.envFile || ['.env'];
      const encrypt = options.plain ? false : options.encrypt !== false;
      const envKeysFile = options.envKeysFile || '.env.keys';

      const results = {
         processedEnvs: [],
         changedFilepaths: [],
         unchangedFilepaths: [],
      };

      for (const envFile of envFiles) {
         const filepath = path.resolve(envFile);
         let content = '';

         if (fs.existsSync(filepath)) {
            content = fs.readFileSync(filepath, 'utf8');
         }

         let newValue = value;
         let privateKeyAdded = false;
         let privateKeyName = null;
         let privateKeyValue = null;

         if (encrypt) {
            const { encrypted, privateKey: newKey, keyName } = this.encrypt(value);
            newValue = encrypted;
            if (newKey && !fs.existsSync(envKeysFile)) {
               privateKeyAdded = true;
               privateKeyName = keyName;
               privateKeyValue = newKey;
               const keysContent = `${keyName}=${newKey}\n`;
               fs.writeFileSync(envKeysFile, keysContent, 'utf8');
            }
         }

         const lines = content.split(/\r?\n/);
         let found = false;
         const newLines = [];

         for (const line of lines) {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match && match[1].trim() === key) {
               newLines.push(`${key}=${newValue}`);
               found = true;
            } else {
               newLines.push(line);
            }
         }

         if (!found) {
            if (content && !content.endsWith('\n')) {
               newLines.push('');
            }
            newLines.push(`${key}=${newValue}`);
         }

         const newContent = newLines.join('\n');
         fs.writeFileSync(filepath, newContent, 'utf8');
         results.changedFilepaths.push(filepath);

         results.processedEnvs.push({
            envFilepath: filepath,
            filepath,
            key,
            value: newValue,
            error: null,
            privateKeyAdded,
            privateKeyName,
            privateKey: privateKeyValue,
            envKeysFilepath: path.resolve(envKeysFile),
         });
      }

      return results;
   }

   encrypt(value, privateKey = null) {
      const algorithm = 'aes-256-gcm';
      const iv = crypto.randomBytes(16);
      const key = privateKey || crypto.randomBytes(32);
      const cipher = crypto.createCipheriv(algorithm, key, iv);

      let encrypted = cipher.update(value, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag().toString('hex');
      const keyName = `DOTENV_KEY_${Date.now()}`;

      return {
         encrypted: `encrypted:${encrypted}.${authTag}.${iv.toString('hex')}`,
         privateKey: key.toString('hex'),
         keyName,
      };
   }

   decrypt(encryptedValue, privateKey) {
      if (!encryptedValue.startsWith('encrypted:')) {
         return encryptedValue;
      }

      const parts = encryptedValue.slice(10).split('.');
      if (parts.length !== 3) {
         return encryptedValue;
      }

      const [encrypted, authTag, iv] = parts;
      const algorithm = 'aes-256-gcm';
      const key = Buffer.from(privateKey, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
      const authTagBuffer = Buffer.from(authTag, 'hex');

      const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
      decipher.setAuthTag(authTagBuffer);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
   }

   keypair(envFile, envKeysFile = null) {
      const filepath = path.resolve(envFile || '.env');
      const keysFilepath = path.resolve(envKeysFile || '.env.keys');

      const keypairs = {};

      if (fs.existsSync(keysFilepath)) {
         const content = fs.readFileSync(keysFilepath, 'utf8');
         const parsed = this.parseEnvStringContent(content);
         for (const [key, value] of Object.entries(parsed)) {
            if (key.startsWith('DOTENV_KEY_')) {
               keypairs[key] = value;
            }
         }
      }

      const newKey = crypto.randomBytes(32).toString('hex');
      const newKeyName = `DOTENV_KEY_${Date.now()}`;
      keypairs[newKeyName] = newKey;

      return keypairs;
   }

   parseEnvStringContent(content) {
      const parsed = {};
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
         if (line.trim() === '' || line.trim().startsWith('#')) {
            continue;
         }
         const match = line.match(/^([^=]+)=(.*)$/);
         if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
               value = value.slice(1, -1);
            }
            parsed[key] = value;
         }
      }
      return parsed;
   }

   ls(directory = '.', envFile = '.env*', excludeEnvFile = []) {
      const dir = path.resolve(directory);
      const files = [];

      if (!fs.existsSync(dir)) {
         return files;
      }

      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
         if (entry.isFile()) {
            const name = entry.name;
            if (this.matchPattern(name, envFile) && !this.isExcluded(name, excludeEnvFile)) {
               files.push({
                  name,
                  path: path.join(dir, name),
                  size: fs.statSync(path.join(dir, name)).size,
               });
            }
         }
      }

      return files;
   }

   matchPattern(name, pattern) {
      if (pattern === '.env*') {
         return name.startsWith('.env');
      }
      return name === pattern;
   }

   isExcluded(name, excludeEnvFile) {
      for (const exclude of excludeEnvFile) {
         if (name === exclude || name.includes(exclude)) {
            return true;
         }
      }
      return false;
   }

   genexample(directory = '.', envFile = '.env') {
      const dir = path.resolve(directory);
      const examplePath = path.join(dir, '.env.example');
      const envPath = path.resolve(envFile);

      if (!fs.existsSync(envPath)) {
         return { created: false, path: examplePath };
      }

      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split(/\r?\n/);
      const exampleLines = [];

      for (const line of lines) {
         if (line.trim() === '' || line.trim().startsWith('#')) {
            exampleLines.push(line);
            continue;
         }

         const match = line.match(/^([^=]+)=(.*)$/);
         if (match) {
            const key = match[1].trim();
            exampleLines.push(`${key}=`);
         }
      }

      fs.writeFileSync(examplePath, exampleLines.join('\n'), 'utf8');

      return { created: true, path: examplePath };
   }

   getConventionFiles(convention) {
      const conventions = {
         nextjs: ['.env.local', '.env.development.local', '.env.development'],
         flow: ['.env.flow', '.env.local'],
      };
      return conventions[convention] || [];
   }

   escape(value) {
      if (!value) return value;
      return value.replace(/'/g, "'\\''");
   }

   config(options = {}) {
      if (options.path && !options.envFile) {
         options.envFile = Array.isArray(options.path) ? options.path : [options.path];
      }

      const result = this.load(options);
      return { parsed: result.parsed, error: result.errors[0] || null };
   }

   rotate(options = {}) {
      if (options.path && !options.envFile) {
         options.envFile = Array.isArray(options.path) ? options.path : [options.path];
      }

      const envFiles = options.envFile || ['.env'];
      const envKeysFile = options.envKeysFile || '.env.keys';
      const excludeKeys = options.excludeKey || [];

      const results = {
         rotated: [],
         errors: [],
      };

      const newKey = crypto.randomBytes(32).toString('hex');
      const newKeyName = `DOTENV_KEY_${Date.now()}`;

      for (const envFile of envFiles) {
         const filepath = path.resolve(envFile);
         if (!fs.existsSync(filepath)) {
            continue;
         }

         let content = fs.readFileSync(filepath, 'utf8');
         const lines = content.split(/\r?\n/);
         const newLines = [];

         for (const line of lines) {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
               const key = match[1].trim();
               let value = match[2].trim();

               if (value.startsWith('encrypted:') && !excludeKeys.includes(key)) {
                  const decrypted = this.decrypt(value, this.privateKey || newKey);
                  const { encrypted } = this.encrypt(decrypted, newKey);
                  value = encrypted;
               }

               newLines.push(`${key}=${value}`);
            } else {
               newLines.push(line);
            }
         }

         fs.writeFileSync(filepath, newLines.join('\n'), 'utf8');
         results.rotated.push(filepath);
      }

      if (!fs.existsSync(envKeysFile)) {
         fs.writeFileSync(envKeysFile, `${newKeyName}=${newKey}\n`, 'utf8');
      } else {
         let keysContent = fs.readFileSync(envKeysFile, 'utf8');
         keysContent += `${newKeyName}=${newKey}\n`;
         fs.writeFileSync(envKeysFile, keysContent, 'utf8');
      }

      return results;
   }
}

function createDotenvX(options) {
   return new DotenvX(options);
}

function config(options) {
   return new DotenvX(options).config(options);
}

function load(options) {
   return new DotenvX(options).load(options);
}

function parse(src, options) {
   return new DotenvX(options).parse(src, options);
}

function get(key, options) {
   return new DotenvX(options).get(key, options);
}

function set(key, value, options) {
   return new DotenvX(options).set(key, value, options);
}

function encrypt(value, privateKey) {
   return new DotenvX({ privateKey }).encrypt(value, privateKey);
}

function decrypt(encryptedValue, privateKey) {
   return new DotenvX({ privateKey }).decrypt(encryptedValue, privateKey);
}

function keypair(envFile, envKeysFile) {
   return new DotenvX().keypair(envFile, envKeysFile);
}

function ls(directory, envFile, excludeEnvFile) {
   return new DotenvX().ls(directory, envFile, excludeEnvFile);
}

function genexample(directory, envFile) {
   return new DotenvX().genexample(directory, envFile);
}

function rotate(options) {
   return new DotenvX(options).rotate(options);
}

module.exports = {
   DotenvX,
   createDotenvX,
   config,
   load,
   parse,
   get,
   set,
   encrypt,
   decrypt,
   keypair,
   ls,
   genexample,
   rotate,
};
