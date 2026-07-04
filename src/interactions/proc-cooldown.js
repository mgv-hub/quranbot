const coreLoader = require('@bot/bootstrap');

// List of interaction types that require voice-specific cooldown enforcement
const voice_interactions = ['join_vc'];

function isVoiceInteraction(interactionType) {
    return voice_interactions.includes(interactionType);
}

// Apply cooldown checks specific to voice-related interactions
async function checkVoiceCooldown(interaction, guildState, interactionType, guildId) {
    if (!isVoiceInteraction(interactionType)) {
        return true;
    }

    if (interactionType === 'join_vc') {
        if (guildState.connection && !guildState.connection.destroyed) {
            const voiceCooldown = coreLoader.checkCooldown(interaction.user.id, coreLoader.COOLDOWN_TYPES.VOICE, guildId);

            if (!voiceCooldown.valid) {
                await interaction.deferUpdate().catch(() => {});
                await interaction
                    .followUp({
                        content: voiceCooldown.message,
                        flags: 64,
                    })
                    .catch(() => {});
                return false;
            }
        }
    }

    return true;
}

module.exports.checkVoiceCooldown = checkVoiceCooldown;
module.exports.isVoiceInteraction = isVoiceInteraction;
module.exports.voice_interactions = voice_interactions;
