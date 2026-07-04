const clientManager = require('./client');
const logger = require('@logging/logger');

const memoryFallbackMap = new Map();

async function get(key) {
    try {
        const client = clientManager.getRedisClient();
        if (clientManager.isRedisReady && client) {
            const result = await client.get(key);
            if (result) {
                try {
                    return JSON.parse(result);
                } catch {
                    return result;
                }
            }
        }
    } catch (error) {
        logger.error(`Redis resilient get failed for key "${key}"`, error.message || error);
    }

    logger.debug(`Redis offline: falling back to memory fetch for key "${key}"`);
    return memoryFallbackMap.get(key) || null;
}

async function set(key, value, options = {}) {
    const serializedValue = typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
    try {
        const client = clientManager.getRedisClient();
        if (clientManager.isRedisReady && client) {
            if (options.EX) {
                await client.set(key, serializedValue, { EX: options.EX });
            } else {
                await client.set(key, serializedValue);
            }
            memoryFallbackMap.set(key, value);
            return true;
        }
    } catch (error) {
        logger.error(`Redis resilient set failed for key "${key}"`, error.message || error);
    }

    logger.debug(`Redis offline: falling back to memory store for key "${key}"`);
    memoryFallbackMap.set(key, value);
    return true;
}

async function del(key) {
    try {
        const client = clientManager.getRedisClient();
        if (clientManager.isRedisReady && client) {
            await client.del(key);
        }
        memoryFallbackMap.delete(key);
        return true;
    } catch (error) {
        logger.error(`Redis resilient del failed for key "${key}"`, error.message || error);
    }

    memoryFallbackMap.delete(key);
    return true;
}

async function keys(pattern) {
    try {
        const client = clientManager.getRedisClient();
        if (clientManager.isRedisReady && client) {
            return await client.keys(pattern);
        }
    } catch (error) {
        logger.error(`Redis resilient keys failed for pattern "${pattern}"`, error.message || error);
    }

    const matchedKeys = [];
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of memoryFallbackMap.keys()) {
        if (regexPattern.test(key)) {
            matchedKeys.push(key);
        }
    }
    return matchedKeys;
}

module.exports = {
    getRedisClient: clientManager.getRedisClient,
    initializeRedis: clientManager.initializeRedis,
    get,
    set,
    del,
    keys,
};

Object.defineProperty(module.exports, 'isRedisReady', {
    get: () => clientManager.isRedisReady,
    enumerable: true,
    configurable: true,
});
