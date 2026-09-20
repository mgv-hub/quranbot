const logger = require('@infrastructure/Logging/Logger');
const {
    loadStatusFromFirebase,
    saveStatusToFirebase,
    clearStatusFromFirebase,
} = require('@infrastructure/Persistence/Firebase/Services/StatusService');

class StatusManager {
    constructor() {
        this.status = {
            presence: null,
            activityType: null,
            activityText: null,
            voiceStatus: null,
        };
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        try {
            const data = await loadStatusFromFirebase();
            if (data && typeof data === 'object') {
                this.status = { ...this.status, ...data };
            }
            this.isInitialized = true;
            logger.info('Status Manager Initialized');
        } catch (error) {
            logger.error('Failed To Initialize Status Manager', error);
            this.isInitialized = true;
        }
    }

    getStatus() {
        return { ...this.status };
    }

    async updateStatus(updates) {
        this.status = { ...this.status, ...updates };
        await saveStatusToFirebase(this.status);
        await this.applyPresence();
        await this.applyVoiceStatus();
        return this.status;
    }

    async clearStatus() {
        this.status = {
            presence: null,
            activityType: null,
            activityText: null,
            voiceStatus: null,
        };
        await clearStatusFromFirebase();

        const { clearStatusCache } = require('@modules/Audio/Voice/VoiceStatus');
        clearStatusCache();

        await this.applyPresence();
        await this.applyVoiceStatus();
        return this.status;
    }

    async applyPresence() {
        const client = global.client;
        if (!client || !client.user) return;

        const typeMap = {
            Playing: 0,
            Watching: 3,
            Listening: 2,
            Competing: 5,
            Custom: 4,
        };

        const presenceData = {
            status: this.status.presence || 'online',
            activities: [],
        };

        const activityType = this.status.activityType || 'Watching';
        const activityTypeValue = typeMap[activityType] ?? 3;
        const activityObj = { type: activityTypeValue };

        if (activityTypeValue === 4) {
            activityObj.name = '/مساعدة | quranbot.cortexhq.net';
            activityObj.state = typeof this.status.activityText === 'string' ? this.status.activityText : '';
        } else {
            activityObj.name =
                typeof this.status.activityText === 'string' && this.status.activityText
                    ? this.status.activityText
                    : '/مساعدة | quranbot.cortexhq.net';
        }

        presenceData.activities.push(activityObj);

        client.user.setPresence(presenceData);
    }

    async applyVoiceStatus() {
        const client = global.client;
        if (!client || !global.guildStates) return;

        const { updateVoiceStatus } = require('@modules/Audio/Voice/VoiceStatus');

        for (const [guildId, guildState] of global.guildStates.entries()) {
            if (guildState.channelId) {
                await updateVoiceStatus(guildId, guildState, client);
            }
        }
    }
}

const statusManager = new StatusManager();
module.exports = statusManager;
