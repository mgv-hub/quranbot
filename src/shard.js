require('dotenv').config();
require('pathlra-aliaser')();

const { ClusterManager } = require('discord-hybrid-sharding');
const logger = require('@logging/logger');
const path = require('path');
require('./config/envSwitcher');

const token = process.env.DISCORD_TOKEN;

if (!token) {
    logger.error('Fatal: Discord Token Not Found In Env File');
    process.exit(1);
}

const totalShardsEnv = process.env.TOTAL_SHARDS;
const shardListEnv = process.env.SHARD_LIST;

let totalShards = 'auto';
let shardList = undefined;
let shardsPerClusters = parseInt(process.env.SHARDS_PER_CLUSTER, 10) || 2;
let totalClusters = 'auto';

if (totalShardsEnv && !isNaN(parseInt(totalShardsEnv, 10))) {
    totalShards = parseInt(totalShardsEnv, 10);
    if (shardListEnv) {
        shardList = shardListEnv.split(',').map((id) => parseInt(id.trim(), 10));
        totalClusters = 1;
        logger.info(`Manual Sharding Configuration Detected Total Shards ${totalShards} Assigned Shards [${shardListEnv}]`);
    }
}

logger.info(`Mode Process Total Shards: ${totalShards} Shards Per Cluster: ${shardsPerClusters} Clusters: ${totalClusters}`);

const manager = new ClusterManager(path.join(__dirname, 'bot/core.js'), {
    totalShards: totalShards,
    shardList: shardList,
    shardsPerClusters: shardsPerClusters,
    totalClusters: totalClusters,
    mode: 'process',
    token: token,
});

manager.on('clusterCreate', (cluster) => {
    logger.info(`Launched Cluster ${cluster.id}`);
    cluster.on('ready', () => logger.info(`Cluster ${cluster.id} Connected To Discord`));
    cluster.on('death', () => logger.warn(`Cluster ${cluster.id} Process Exited`));
    cluster.on('disconnect', () => logger.warn(`Cluster ${cluster.id} Disconnected`));
    cluster.on('reconnecting', () => logger.info(`Cluster ${cluster.id} Reconnecting`));
});

(async () => {
    await manager.spawn({ timeout: -1 });
    logger.info('All Clusters Spawned Successfully');
})();
