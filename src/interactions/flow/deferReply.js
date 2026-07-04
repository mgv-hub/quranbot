const logger = require('@logging/logger');

async function deferInteraction(interaction, ephemeral = false) {
    if (interaction.deferred || interaction.replied) return;
    try {
        if (interaction.isCommand()) {
            await interaction.deferReply({ flags: ephemeral ? 64 : undefined });
        } else {
            await interaction.deferUpdate();
        }
    } catch (error) {
        logger.debug('Defer failed: ' + error.message);
    }
}

function wrapContentInV2(content) {
    return [
        {
            type: 17,
            accent_color: 0xfefdfe,
            components: [{ type: 10, content: content }],
        },
    ];
}

async function safeReply(interaction, options, loggerRef = logger) {
    const sendOptions = { ...options };

    const hasComponentsV2 = sendOptions.components?.some((c) => c.type === 17 || c.type === 10 || c.type === 14 || c.type === 12);
    const hasContent = !!sendOptions.content;
    const hasEmbeds = !!sendOptions.embeds?.length;
    const hasFiles = !!sendOptions.files?.length;

    if (hasContent && !hasComponentsV2 && !hasEmbeds && !hasFiles) {
        sendOptions.components = wrapContentInV2(sendOptions.content);
        delete sendOptions.content;
    }

    if (sendOptions.components?.some((c) => c.type === 17)) {
        if (!sendOptions.flags) {
            sendOptions.flags = 32768;
        } else if ((sendOptions.flags & 32768) === 0) {
            sendOptions.flags = sendOptions.flags | 32768;
        }
    }

    try {
        if (interaction.deferred && !interaction.replied) {
            return await interaction.editReply(sendOptions);
        } else if (interaction.replied || interaction.deferred) {
            return await interaction.followUp(sendOptions);
        } else {
            return await interaction.reply(sendOptions);
        }
    } catch (error) {
        const errMsg = error.message || '';
        const isComponentsV2Error = errMsg.includes('IS_COMPONENTS_V2') || errMsg.includes('COMPONENTS_V2');
        if (isComponentsV2Error && (interaction.replied || interaction.deferred)) {
            try {
                return await interaction.followUp(sendOptions);
            } catch (followUpErr) {}
        }
        try {
            if (interaction.channel) {
                const channelOptions = { ...sendOptions };
                if (channelOptions.flags) {
                    channelOptions.flags = channelOptions.flags & ~64;
                    if (channelOptions.flags === 0) delete channelOptions.flags;
                }
                if (!channelOptions.components?.some((c) => c.type === 17) && channelOptions.flags) {
                    channelOptions.flags = channelOptions.flags | 32768;
                }
                return await interaction.channel.send(channelOptions);
            }
        } catch (fallbackError) {
            loggerRef.error('All reply methods failed: ' + error.message);
        }
    }
}

async function safeError(interaction, message, loggerRef = logger) {
    await safeReply(interaction, { content: message, flags: 64 }, loggerRef);
}

async function wrapInteraction(interaction, executor, options = {}) {
    const { ephemeral = true, context = {} } = options;
    await deferInteraction(interaction, ephemeral);
    try {
        return await executor(interaction, context);
    } catch (error) {
        logger.error(`Interaction error in ${context.label || 'handler'}: ${error.message}`, error);
        await safeError(interaction, 'حدث خطأ أثناء معالجة الطلب', context.logger || logger);
    }
}

module.exports.deferInteraction = deferInteraction;
module.exports.safeReply = safeReply;
module.exports.safeError = safeError;
module.exports.wrapInteraction = wrapInteraction;
