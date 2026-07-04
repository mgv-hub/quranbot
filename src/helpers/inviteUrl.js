function generateInviteUrl(clientId) {
    const id = clientId || global.clientId;
    return `https://discord.com/oauth2/authorize?client_id=${id}&permissions=2150665281&scope=bot%20applications.commands`;
}

module.exports.generateInviteUrl = generateInviteUrl;
