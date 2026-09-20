const logger = require('@infrastructure/Logging/Logger');
const { loadPrayerRemindersFromFirebase, savePrayerReminderToFirebase, deletePrayerReminderFromFirebase } = require('@infrastructure/Persistence/Firebase/Services/PrayerRemindersService');
const { prayer_reminder_config } = require('@config/Constants');

class PrayerReminderManager {
    constructor() {
        this._reminders = new Map();
        this._isInitialized = false;
        this._initPromise = null;
    }

    get isInitialized() {
        return this._isInitialized;
    }

    async initialize() {
        if (this._isInitialized) return;
        if (this._initPromise) return this._initPromise;

        this._initPromise = (async () => {
            try {
                const data = await loadPrayerRemindersFromFirebase();
                for (const [guildId, config] of Object.entries(data)) {
                    const configToValidate = { ...config, guildId };
                    if (this._validateConfig(configToValidate)) {
                        this._reminders.set(guildId, Object.freeze({ ...configToValidate, prayers: [...configToValidate.prayers], roles: [...(configToValidate.roles || [])] }));
                    }
                }
                this._isInitialized = true;
                logger.info('Prayer Reminder Manager Initialized With ' + this._reminders.size + ' Reminders');
            } catch (error) {
                logger.error('Failed To Initialize Prayer Reminder Manager', error);
                this._isInitialized = true;
            } finally {
                this._initPromise = null;
            }
        })();
        return this._initPromise;
    }

    _validateConfig(config) {
        if (!config || typeof config !== 'object') return false;
        if (typeof config.channelId !== 'string' || !config.channelId) return false;
        if (typeof config.lat !== 'number' || isNaN(config.lat) || config.lat < -90 || config.lat > 90) return false;
        if (typeof config.lng !== 'number' || isNaN(config.lng) || config.lng < -180 || config.lng > 180) return false;
        if (!prayer_reminder_config.valid_methods.has(Number(config.method))) return false;
        if (!Array.isArray(config.prayers) || config.prayers.length === 0) return false;
        if (!config.prayers.every((p) => prayer_reminder_config.valid_prayers.has(p))) return false;
        if (config.roles && (!Array.isArray(config.roles) || config.roles.length > 3)) return false;
        return true;
    }

    get(guildId) {
        const config = this._reminders.get(guildId);
        if (!config) return undefined;
        return Object.freeze({ ...config, prayers: [...config.prayers], roles: [...(config.roles || [])] });
    }

    async set(guildId, config) {
        const configToValidate = { ...config, guildId };
        if (!this._validateConfig(configToValidate)) {
            throw new Error('Invalid prayer reminder configuration');
        }
        const frozenConfig = Object.freeze({
            ...configToValidate,
            timezone: configToValidate.timezone || 'Africa/Cairo',
            prayers: [...configToValidate.prayers],
            roles: [...(configToValidate.roles || [])],
            configVersion: (configToValidate.configVersion || 0) + 1,
        });
        this._reminders.set(guildId, frozenConfig);
        await savePrayerReminderToFirebase(guildId, frozenConfig);
        return frozenConfig;
    }

    async pause(guildId) {
        const config = this._reminders.get(guildId);
        if (!config) throw new Error('No reminder found for this guild');
        const updatedConfig = { ...config, enabled: false };
        const frozenConfig = Object.freeze({
            ...updatedConfig,
            prayers: [...updatedConfig.prayers],
            roles: [...(updatedConfig.roles || [])],
            configVersion: (updatedConfig.configVersion || 0) + 1,
        });
        this._reminders.set(guildId, frozenConfig);
        await savePrayerReminderToFirebase(guildId, frozenConfig);
        return frozenConfig;
    }

    async resume(guildId) {
        const config = this._reminders.get(guildId);
        if (!config) throw new Error('No reminder found for this guild');
        const updatedConfig = { ...config, enabled: true };
        const frozenConfig = Object.freeze({
            ...updatedConfig,
            prayers: [...updatedConfig.prayers],
            roles: [...(updatedConfig.roles || [])],
            configVersion: (updatedConfig.configVersion || 0) + 1,
        });
        this._reminders.set(guildId, frozenConfig);
        await savePrayerReminderToFirebase(guildId, frozenConfig);
        return frozenConfig;
    }

    async remove(guildId) {
        this._reminders.delete(guildId);
        await deletePrayerReminderFromFirebase(guildId);
    }

    getAll() {
        return Array.from(this._reminders.entries()).map(([gid, config]) => ({
            ...config,
            guildId: gid,
            prayers: [...config.prayers],
            roles: [...(config.roles || [])],
        }));
    }
}

const prayerReminderManager = new PrayerReminderManager();

module.exports.initialize = prayerReminderManager.initialize.bind(prayerReminderManager);
module.exports.get = prayerReminderManager.get.bind(prayerReminderManager);
module.exports.set = prayerReminderManager.set.bind(prayerReminderManager);
module.exports.pause = prayerReminderManager.pause.bind(prayerReminderManager);
module.exports.resume = prayerReminderManager.resume.bind(prayerReminderManager);
module.exports.remove = prayerReminderManager.remove.bind(prayerReminderManager);
module.exports.getAll = prayerReminderManager.getAll.bind(prayerReminderManager);
module.exports.reminders = prayerReminderManager._reminders;

Object.defineProperty(module.exports, 'isInitialized', {
    get: () => prayerReminderManager.isInitialized,
    set: (value) => {
        prayerReminderManager._isInitialized = value;
    },
    enumerable: true,
    configurable: true,
});
