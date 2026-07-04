const { ChannelType, PermissionsBitField, OverwriteType } = require('discord.js');
const { channel_names } = require('@config/constants');

async function createCategory(guild, ix, isReSetup) {
    let cat = guild.channels.cache.find((c) => c.name === channel_names.category && c.type === ChannelType.GuildCategory);
    if (!cat) {
        cat = await guild.channels.create({
            name: channel_names.category,
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                },
                {
                    id: guild.client.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels],
                },
                {
                    id: ix.user.id,
                    type: OverwriteType.Member,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels],
                },
            ],
            reason: (isReSetup ? 'Re-setup' : 'Setup') + ' by ' + ix.user.tag,
        });
    }
    return cat;
}

async function createVoiceChannel(guild, cat, ix, isReSetup) {
    let voice = guild.channels.cache.find(
        (c) => c.name === channel_names.voice && c.type === ChannelType.GuildVoice && c.parentId === cat.id,
    );
    if (!voice) {
        voice = await guild.channels.create({
            // Voice channel creation
            name: channel_names.voice,
            type: ChannelType.GuildVoice,
            parent: cat.id,
            bitrate: 64000,
            userLimit: 0,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.Connect,
                        PermissionsBitField.Flags.ReadMessageHistory,
                    ],
                    deny: [PermissionsBitField.Flags.Speak],
                },
                {
                    id: guild.client.user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.ManageChannels,
                        PermissionsBitField.Flags.EmbedLinks,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.Connect,
                        PermissionsBitField.Flags.Speak,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.UseExternalEmojis,
                    ],
                },
                {
                    id: ix.user.id,
                    type: OverwriteType.Member,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels],
                },
            ],
            reason: (isReSetup ? 'Re-setup' : 'Setup') + ' by ' + ix.user.tag,
        });
    }
    return voice;
}

async function createTextChannel(guild, cat, ix, isReSetup) {
    let text = guild.channels.cache.find((c) => c.name === channel_names.text && c.type === ChannelType.GuildText && c.parentId === cat.id);
    if (!text) {
        // Text channel creation
        text = await guild.channels.create({
            name: channel_names.text,
            type: ChannelType.GuildText,
            parent: cat.id,
            rateLimitPerUser: 0,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                    deny: [
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.EmbedLinks,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.AddReactions,
                    ],
                },
                {
                    id: guild.client.user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ManageChannels,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.EmbedLinks,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.AddReactions,
                    ],
                },
                {
                    id: ix.user.id,
                    type: OverwriteType.Member,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ManageChannels,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.AddReactions,
                    ],
                },
            ],
            reason: (isReSetup ? 'Re-setup' : 'Setup') + ' by ' + ix.user.tag,
        });
    }
    return text;
}

async function createAzkarChannel(guild, cat, ix, isReSetup) {
    let azkar = guild.channels.cache.find(
        (c) => c.name === channel_names.azkar && c.type === ChannelType.GuildText && c.parentId === cat.id,
    );
    if (!azkar) {
        // Azkar channel creation
        azkar = await guild.channels.create({
            name: channel_names.azkar,
            type: ChannelType.GuildText,
            parent: cat.id,
            rateLimitPerUser: 0,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.AddReactions,
                    ],
                    deny: [
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.EmbedLinks,
                        PermissionsBitField.Flags.AttachFiles,
                    ],
                },
                {
                    id: guild.client.user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ManageChannels,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.EmbedLinks,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.AddReactions,
                    ],
                },
                {
                    id: ix.user.id,
                    type: OverwriteType.Member,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ManageChannels,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.AddReactions,
                    ],
                },
            ],
            reason: (isReSetup ? 'Re-setup' : 'Setup') + ' by ' + ix.user.tag,
        });
    }
    return azkar;
}

module.exports.createCategory = createCategory;
module.exports.createVoiceChannel = createVoiceChannel;
module.exports.createTextChannel = createTextChannel;
module.exports.createAzkarChannel = createAzkarChannel;
