const coreLoader = require('@bot/bootstrap');
const { getErrorType } = require('@interactions/interactionErrors');

// Categorize commands by access level and execution context
const public_commands = ['مصادر', 'مواقيت_الصلاة', 'سرعة', 'دليل', 'تحديثات', 'مساعدة', 'تفسير', 'بحث', 'سورة', 'المسباح'];
const admin_commands = ['خروج', 'دخول', 'دخول_قناة', 'إعداد', 'تعيين_القنوات'];
const control_commands = ['تحكم'];
const guild_required_commands = ['تحكم', 'خروج', 'دخول', 'دخول_قناة', 'إعداد'];

function isPublicCommand(commandName) {
    return public_commands.includes(commandName);
}

function isAdmin_Command(commandName) {
    return admin_commands.includes(commandName);
}

function isControlCommand(commandName) {
    return control_commands.includes(commandName);
}

function requiresGuild(commandName) {
    return guild_required_commands.includes(commandName);
}

// Main handler for slash command interactions with full validation pipeline
async function handleCommandInteraction(interaction, guildState) {
    const commandName = interaction.commandName;
    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    if (!interaction.guild && requiresGuild(commandName)) {
        try {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply({
                    content: 'هذا الأمر يمكن استخدامه فقط داخل السيرفرات وليس في الرسائل الخاصة',
                    flags: 64,
                });
            }
        } catch (error) {
            coreLoader.logger.debug('DM Command Block Reply Failed');
        }
        return false;
    }
    const cooldownResult = coreLoader.checkCooldown(userId, guildId, commandName);
    if (!cooldownResult.allowed) {
        try {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply({
                    content: coreLoader.getCooldownResponse(cooldownResult.remaining, cooldownResult.type),
                    flags: 64,
                });
            }
        } catch (error) {
            coreLoader.logger.debug('Failed to send cooldown message');
        }
        return false;
    }
    if (isAdmin_Command(commandName) || isControlCommand(commandName)) {
        if (!coreLoader.isAuthorized(interaction, guildState, null)) {
            try {
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.reply({
                        content: 'تتطلب هذه العملية امتلاك صلاحيات المسؤول (Administrator)',
                        flags: 64,
                    });
                }
            } catch (error) {
                coreLoader.logger.debug('Admin Command Auth Failed');
            }
            return false;
        }
    }
    await deferCommandInteraction(interaction, commandName);
    await coreLoader.incrementCommandStats(commandName);
    const success = await executeCommand(interaction, commandName);
    // Set cooldown after successful execution only
    if (success !== false) {
        coreLoader.setCooldown(userId, guildId, commandName);
    }
    return true;
}
// Defer command response with appropriate ephemeral settings based on command type
async function deferCommandInteraction(interaction, commandName) {
    try {
        if (!interaction.deferred && !interaction.replied) {
            if (isPublicCommand(commandName) || !interaction.guild) {
                await interaction.deferReply({ flags: 64 });
            } else if (isAdmin_Command(commandName)) {
                await interaction.deferReply({ flags: 64 });
            } else {
                await interaction.deferReply();
            }
        }
    } catch (deferError) {
        const deferErrorType = getErrorType(deferError);
        if (deferErrorType === 'INTERACTION_EXPIRED') {
            coreLoader.logger.debug(`Command Interaction Expired Before Defer ${commandName}`);
            throw deferError;
        }
        throw deferError;
    }
}
// Route command name to its corresponding execution module
async function executeCommand(interaction, commandName) {
    switch (commandName) {
        case 'سرعة':
            return await coreLoader.pingCommand.execute(interaction);
        case 'دخول':
            return await coreLoader.joinCommand.execute(interaction);
        case 'دخول_قناة':
            return await coreLoader.joinChannelCommand.execute(interaction);
        case 'خروج':
            return await coreLoader.leaveCommand.execute(interaction);
        case 'تحكم':
            return await coreLoader.controlCommand.execute(interaction);
        case 'إعداد':
            return await coreLoader.setupCommand.execute(interaction);
        case 'دليل':
            return await coreLoader.guideCommand.execute(interaction);
        case 'مواقيت_الصلاة':
            return await coreLoader.prayerTimesCommand.execute(interaction);
        case 'مصادر':
            return await coreLoader.sourcesCommand.execute(interaction);
        case 'تحديثات':
            return await coreLoader.changelogCommand.execute(interaction);
        case 'مساعدة':
            return await coreLoader.helpCommand.execute(interaction);
        case 'تفسير':
            return await coreLoader.tafseerCommand.execute(interaction);
        // case 'بحث':
        //     return await coreLoader.searchCommand.execute(interaction);
        case 'سورة':
            return await coreLoader.surahCommand.execute(interaction);
        case 'المسباح':
            return await coreLoader.tasbihCommand.execute(interaction);
        case 'تعيين_القنوات':
            return await coreLoader.assignChannelsCommand.execute(interaction);
        default:
            if (!interaction.replied && !interaction.deferred) {
                await interaction.editReply({
                    content: 'لم يتم التعرف على الأمر',
                    flags: 64,
                });
            }
            return false;
    }
}
module.exports.handleCommandInteraction = handleCommandInteraction;
module.exports.isPublicCommand = isPublicCommand;
module.exports.isAdmin_Command = isAdmin_Command;
module.exports.isControlCommand = isControlCommand;
module.exports.requiresGuild = requiresGuild;
