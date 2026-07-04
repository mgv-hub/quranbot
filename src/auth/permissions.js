const { PermissionsBitField } = require('discord.js');
const logger = require('@logging/logger');
const auth = require('@auth/auth-manager');

// Delegated core authorization to authManager.js to remove duplicate permission logic
module.exports.isAuthorized = auth.isAuthorized;
module.exports.checkAuthorization = auth.authorizeInteraction;
module.exports.hasAdminPermission = auth.hasAdminPermission;
module.exports.hasAdminRole = auth.hasAdminRole;
module.exports.isSpecialUser = auth.isSpecialUser;

// Retained unique voice permission checks that are not duplicated elsewhere
module.exports.isMemberInVoiceChannel = function isMemberInVoiceChannel(interaction) {
    try {
        return interaction.member?.voice.channelId !== null;
    } catch {
        return false;
    }
};

module.exports.checkBotVoicePermissions = function checkBotVoicePermissions(interaction, state) {
    try {
        const guild = interaction.guild;
        if (!guild) return false;
        const botMember = guild.members.me;
        if (!botMember) return false;
        if (state?.channelId) {
            const channel = guild.channels.cache.get(state.channelId);
            if (channel) {
                const permissions = channel.permissionsFor(botMember);
                return permissions.has(PermissionsBitField.Flags.Connect) && permissions.has(PermissionsBitField.Flags.Speak);
            }
        }
        const member = interaction.member;
        if (member?.voice.channel) {
            const permissions = member.voice.channel.permissionsFor(botMember);
            return permissions.has(PermissionsBitField.Flags.Connect) && permissions.has(PermissionsBitField.Flags.Speak);
        }
        return false;
    } catch {
        return false;
    }
};
