const logger = require('@logging/logger');
async function deferIfPending(interaction, ephemeral = false) {
    if (interaction.deferred || interaction.replied) return;
    try {
        if (interaction.isCommand()) {
            await interaction.deferReply({ flags: ephemeral ? 64 : undefined });
        } else {
            if (ephemeral) {
                await interaction.deferReply({ flags: 64 });
            } else {
                await interaction.deferUpdate();
            }
        }
    } catch (err) {
        // ignore known defer conflicts (code 40060)
        if (err.code !== 40060) {
            logger.debug('Defer skipped/failed: ' + err.message);
        }
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

// reply chain: tries edit/followup first, falls back to channel.send if interaction expires (10062)
async function safeReply(interaction, options, ctx = 'unknown') {
    let result = null;
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
        if (interaction.replied) {
            result = await interaction.followUp(sendOptions);
            if (result) return result;
        } else if (interaction.deferred) {
            result = await interaction.editReply(sendOptions);
            if (result) return result;
        } else {
            result = await interaction.reply(sendOptions);
            if (result) return result;
        }
    } catch (primary) {
        const errMsg = primary.message || '';
        const isComponentsV2Error = errMsg.includes('IS_COMPONENTS_V2') || errMsg.includes('COMPONENTS_V2');
        if (isComponentsV2Error && interaction.deferred && !interaction.replied) {
            try {
                result = await interaction.followUp(sendOptions);
                if (result) return result;
            } catch (followUpErr) {
                // Fall through to channel.send
            }
        } else {
            logger.debug('Primary reply failed in ' + ctx + ': ' + primary.message);
        }
    }
    // If we got here, primary methods failed or returned null - try channel fallback
    if (interaction.channel) {
        try {
            const channelOptions = { ...sendOptions };
            if (channelOptions.flags) {
                channelOptions.flags = channelOptions.flags & ~64;
                if (channelOptions.flags === 0) delete channelOptions.flags;
            }
            if (!channelOptions.components?.some((c) => c.type === 17) && channelOptions.flags) {
                channelOptions.flags = channelOptions.flags | 32768;
            }
            result = await interaction.channel.send(channelOptions);
            if (result) return result;
        } catch (chanErr) {
            logger.error('Channel fallback failed in ' + ctx, chanErr);
        }
    }

    return null;
}

async function safeError(interaction, message, ctx = 'unknown') {
    return safeReply(interaction, { content: message, flags: 64 }, ctx);
}

function getFriendlyErrorMessage(error) {
    if (!error) return 'حدث خطأ غير متوقع';
    const msg = error.message || String(error);
    if (msg.includes('Missing Permissions') || msg.includes('50013')) {
        return 'البوت لا يملك الصلاحيات المطلوبة لتنفيذ هذا الإجراء';
    }
    if (msg.includes('Unknown interaction') || msg.includes('10062')) {
        return 'انتهت صلاحية التفاعل، يرجى استخدام الأمر مجدداً';
    }
    if (msg.includes('Unknown Message') || msg.includes('10008')) {
        return 'تم حذف رسالة التحكم، يرجى إنشاء لوحة جديدة';
    }
    if (msg.includes('VoiceConnection') || msg.includes('4004')) {
        return 'حدث خطأ في الاتصال الصوتي، يرجى إعادة الدخول';
    }
    if (msg.includes('No compatible encryption modes')) {
        return 'تعذر الاتصال بخادم الصوت الحالي يرجى المحاولة لاحقا أو التواصل مع الدعم الفني';
    }
    return 'حدث خطأ أثناء معالجة الطلب، يرجى المحاولة لاحقاً';
}

async function handleInteractionError(interaction, error, ctx = 'unknown') {
    logger.error(`Interaction Error [${ctx}]: ${error.message}`, error);
    const friendly = getFriendlyErrorMessage(error);
    await safeError(interaction, friendly, ctx);
}

async function wrapInteraction(interaction, executor, opts = {}) {
    const { ephemeral = true, label = 'unknown' } = opts;
    await deferIfPending(interaction, ephemeral);
    try {
        return await executor(interaction, { label });
    } catch (err) {
        await handleInteractionError(interaction, err, label);
    }
}

module.exports.deferIfPending = deferIfPending;
module.exports.safeReply = safeReply;
module.exports.safeError = safeError;
module.exports.getFriendlyErrorMessage = getFriendlyErrorMessage;
module.exports.handleInteractionError = handleInteractionError;
module.exports.wrapInteraction = wrapInteraction;
