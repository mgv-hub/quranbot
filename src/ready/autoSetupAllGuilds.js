const { ChannelType } = require('discord.js');
const logger = require('@logging/logger');
const { setupQuranCategory } = require('@setup/setupQuranCategory');

async function autoSetupAllGuilds(client) {
    try {
        const setups = global.setupGuilds || {};

        let ok = 0,
            fail = 0;

        for (const [gid, data] of Object.entries(setups)) {
            try {
                const guild = client.guilds.cache.get(gid);
                if (!guild) {
                    logger.warn('Guild missing for auto-setup ' + gid);
                    fail++;
                    continue;
                }

                const mockIx = {
                    guild,
                    user: client.user,
                    channel:
                        (await guild.channels.fetch(data.textChannelId).catch(() => null)) ||
                        guild.channels.cache.find((c) => c.type === ChannelType.GuildText),
                };

                if (!mockIx.channel) {
                    logger.warn('No text channel for guild ' + gid);
                    fail++;
                    continue;
                }

                await setupQuranCategory(guild, mockIx, { channelWillBeDeleted: false });
                ok++;
                logger.info('Auto-setup OK: ' + gid);
            } catch (e) {
                logger.error('Auto-setup failed: ' + gid, e);
                fail++;
            }
        }

        return { success: ok, failed: fail };
    } catch (e) {
        return {
            success: 0,
            failed: Object.keys(global.setupGuilds || {}).length,
            error: e.message,
        };
    }
}

module.exports.autoSetupAllGuilds = autoSetupAllGuilds;
