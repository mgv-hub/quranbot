const logger = require('@logging/logger');
const { emoji } = require('@helpers/emojis');

let _parsed = null;
let lastParsed = null;

function _parseNodesFromEnv() {
    const currentJson = process.env.LAVALINK_NODES_;
    if (_parsed && lastParsed === currentJson) {
        return _parsed;
    }
    if (currentJson && currentJson.trim().startsWith('[')) {
        const nodes = JSON.parse(currentJson);
        if (Array.isArray(nodes)) {
            const validated = nodes
                .filter((n, idx) => {
                    const valid = n.host && n.port && n.password;
                    return valid;
                })
                .map((n, idx) => ({
                    id: n.id || `node-${idx + 1}`,
                    index: idx + 1,
                    host: n.host,
                    port: Number(n.port),
                    password: n.password,
                    secure: n.secure === true || n.secure === 'true',
                    maxPlayers: Number(n.maxPlayers) || 100,
                    location: n.location || 'Unknown Location',
                    flag: n.flag || `${emoji.globe}`,
                    playerCreateDelay: Number(n.playerCreateDelay) || 0,
                }));

            _parsed = validated;
            lastParsed = currentJson;
            logger.info(`Loaded ${validated.length} Lavalink`);
            return validated;
        }
    }

    const Legacy = [];
    const Count = parseInt(process.env.LAVALINK_NODES || '0', 10);

    for (let i = 1; i <= Count; i++) {
        const prefix = `LAVALINK_NODE_${i}`;
        const host = process.env[`${prefix}_HOST`];
        const port = process.env[`${prefix}_PORT`];
        const password = process.env[`${prefix}_PASSWORD`];

        if (!host || !port || !password) {
            logger.warn(`Skipping legacy node ${i}`);
            continue;
        }

        Legacy.push({
            id: `node-${i}`,
            index: i,
            host,
            port: Number(port),
            password,
            secure: process.env[`${prefix}_SECURE`] === 'true',
            maxPlayers: parseInt(process.env[`${prefix}_MAX_PLAYERS`] || '100', 10),
            location: process.env[`${prefix}_LOCATION`] || 'Unknown',
            flag: process.env[`${prefix}_FLAG`] || `${emoji.globe}`,
            playerCreateDelay: parseInt(process.env[`${prefix}_PLAYER_CREATE_DELAY`] || '0', 10),
        });
    }
    _parsed = Legacy;
    lastParsed = currentJson;
    return Legacy;
}

function getNodeCount() {
    return _parseNodesFromEnv().length;
}

function parseNodeConfig(index) {
    const nodes = _parseNodesFromEnv();

    if (typeof index === 'number') {
        return nodes.find((n) => n.index === index) || null;
    }

    if (typeof index === 'string') {
        return nodes.find((n) => n.id === index) || null;
    }

    return null;
}

function buildLavalink() {
    const nodes = _parseNodesFromEnv();

    return nodes.map((node) => ({
        id: node.id,
        host: node.host,
        port: node.port,
        authorization: node.password,
        secure: node.secure,
        retryAmount: 999999,
        retryDelay: 30000,
    }));
}

function getNodeInfo(nodeId) {
    const node = _parseNodesFromEnv().find((n) => n.id === nodeId);

    if (node) {
        return { location: node.location, flag: node.flag };
    }

    return { location: 'Unknown', flag: `${emoji.globe}` };
}

function getAllNodesInfo() {
    return _parseNodesFromEnv().map((node) => ({
        id: node.id,
        index: node.index,
        host: node.host,
        port: node.port,
        password: node.password,
        secure: node.secure,
        location: node.location,
        flag: node.flag,
    }));
}

function clearNodeCache() {
    _parsed = null;
    lastParsed = null;
}

module.exports.getNodeCount = getNodeCount;
module.exports.parseNodeConfig = parseNodeConfig;
module.exports.buildLavalink = buildLavalink;
module.exports.getNodeInfo = getNodeInfo;
module.exports.getAllNodesInfo = getAllNodesInfo;
module.exports.clearNodeCache = clearNodeCache;
module.exports._parseNodesFromEnv = _parseNodesFromEnv;
