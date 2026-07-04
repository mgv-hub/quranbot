const Topgg = require('@top-gg/sdk');
const logger = require('@logging/logger');
const { client } = require('@startup/botSetup');

const DBL_TOKEN = process.env.TOPGG_TOKEN;

class topgg {
    constructor(token) {
        this.api = new Topgg.Api(token);
        this.timer = null;
    }

    async SubmitStats() {
        try {
            const count = client.guilds.cache.size;
            await this.api.postStats({ serverCount: count });
        } catch (err) {
            logger.error(err);
        }
    }

    CalculateNext_Midnight() {
        const now = new Date();
        const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
        return next.getTime() - now.getTime();
    }

    start_() {
        const delaY = this.CalculateNext_Midnight();
        this.timer = setTimeout(() => {
            this.SubmitStats();
            this.timer = setInterval(() => this.SubmitStats(), 86400000);
        }, delaY);
    }

    stop() {
        if (this.timer) {
            clearTimeout(this.timer);
            clearInterval(this.timer);
        }
    }
}

if (DBL_TOKEN) {
    const manager = new topgg(DBL_TOKEN);
    client.once('clientReady', () => {
        manager.start_();
    });
}
