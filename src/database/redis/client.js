const { createClient } = require('redis');
const logger = require('@logging/logger');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let client = null;
let _isRedisReady = false;
let connectionAttempts = 0;
const max_connection_attempts = 5;

async function initializeRedis() {
    if (_isRedisReady && client) {
        return true;
    }

    logger.info('Initializing Redis Connection...');
    try {
        client = createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger.error('Redis Reconnect Strategy: Max retries reached. Stopping reconnection.');
                        return new Error('Max reconnect retries reached');
                    }
                    return Math.min(retries * 200, 3000);
                },
            },
        });

        client.on('error', (error) => {
            logger.error('Redis connection/socket error', error.message || error);
            _isRedisReady = false;
        });

        client.on('connect', () => {
            logger.info('Redis connection established');
        });

        client.on('ready', () => {
            _isRedisReady = true;
            logger.info('Redis client is ready for commands');
        });

        client.on('end', () => {
            _isRedisReady = false;
            logger.warn('Redis connection closed');
        });

        await client.connect();
        return true;
    } catch (error) {
        connectionAttempts++;
        logger.error(`Redis connection failed (Attempt ${connectionAttempts}/${max_connection_attempts})`, error.message || error);

        if (connectionAttempts < max_connection_attempts) {
            await new Promise((resolve) => setTimeout(resolve, 2000 * connectionAttempts));
            return await initializeRedis();
        }
        return false;
    }
}

if (process.env.NODE_ENV !== 'test' && process.env.SKIP_AUTO_INIT !== 'true') {
    initializeRedis();
}

Object.defineProperty(module.exports, 'isRedisReady', {
    get: () => _isRedisReady,
    enumerable: true,
    configurable: true,
});

module.exports.client = client;
module.exports.getRedisClient = () => client;
module.exports.initializeRedis = initializeRedis;
module.exports.max_connection_attempts = max_connection_attempts;
