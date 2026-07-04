const { wrapInteraction, safeError, safeReply } = require('@interactions/flow/responder');
const { MessageFlags } = require('discord.js');
const { clean_Dhikr } = require('@helpers/azkar');

// const azkar_request_expiry = 10 * 24 * 60 * 60 * 1000;

module.exports = {
    customId: 'azkar_audio',
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const buttonId = interaction.customId;
                // let requestTimestamp = null;
                let parsedFilename = null;

                if (buttonId && buttonId.startsWith('play_azkar_')) {
                    const idParts = buttonId.split('_');
                    const lastPart = idParts[idParts.length - 1];
                    if (lastPart && !isNaN(lastPart)) {
                        // requestTimestamp = parseInt(lastPart, 10);
                        parsedFilename = idParts.slice(2, idParts.length - 1).join('_');
                    } else {
                        parsedFilename = buttonId.replace('play_azkar_', '');
                    }
                }

                // if (requestTimestamp && Date.now() - requestTimestamp > azkar_request_expiry) {
                //     await safeError(
                //         interaction,
                //         'عذراً هذا الذكر قديم جداً (أكثر من 10 أيام) لا يمكن تشغيل الصوت للرسائل القديمة',
                //         'azkar_expiry',
                //     );
                //     return;
                // }

                let audioInfo = require('../../state/azkarManager').getAzkarAudioUrl(buttonId);
                let dhikrDisplayText = 'ذكر';
                let finalAudioUrl = null;
                let finalFilename = 'dhikr';

                if (!audioInfo || !audioInfo.url) {
                    if (parsedFilename) {
                        const azkarCollection = global.azkarData || [];
                        let matchFound = false;
                        for (const category of azkarCollection) {
                            if (category.array && Array.isArray(category.array)) {
                                for (const dhikrEntry of category.array) {
                                    if (dhikrEntry.filename === parsedFilename || dhikrEntry.audio?.includes(parsedFilename)) {
                                        finalAudioUrl = 'https://hub-mgv.github.io/QuranBotData/' + dhikrEntry.audio;
                                        finalFilename = dhikrEntry.filename || parsedFilename;
                                        dhikrDisplayText = dhikrEntry.text || 'ذكر';
                                        matchFound = true;
                                        break;
                                    }
                                }
                            }
                            if (matchFound) break;
                        }
                    }
                } else {
                    finalAudioUrl = audioInfo.url;
                    finalFilename = audioInfo.filename || 'dhikr';
                    const azkarCollection = global.azkarData || [];
                    for (const category of azkarCollection) {
                        if (category.array && Array.isArray(category.array)) {
                            for (const dhikrEntry of category.array) {
                                if (dhikrEntry.filename === finalFilename || dhikrEntry.audio?.includes(finalFilename)) {
                                    dhikrDisplayText = dhikrEntry.text || 'ذكر';
                                    break;
                                }
                            }
                        }
                        if (dhikrDisplayText !== 'ذكر') break;
                    }
                }

                if (!finalAudioUrl) {
                    await safeError(interaction, 'عذرا رابط الصوت غير متوفر', 'azkar_no_url');
                    return;
                }

                dhikrDisplayText = clean_Dhikr(dhikrDisplayText);
                if (dhikrDisplayText.length > 100) {
                    dhikrDisplayText = dhikrDisplayText.substring(0, 97) + '...';
                }

                await safeReply(
                    interaction,
                    {
                        content: `${dhikrDisplayText}`,
                        files: [{ attachment: finalAudioUrl, name: `${finalFilename}.mp3` }],
                        flags: MessageFlags.Ephemeral,
                    },
                    'azkar_audio_sent',
                );
            },
            { ephemeral: true, label: 'azkar_audio_button' },
        );
    },
};
