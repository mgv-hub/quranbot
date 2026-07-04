const { emoji } = require('@helpers/emojis');

function buildSuccessEmbed(setupResult, isReSetup) {
    return {
        embeds: [
            {
                color: 0x1e1f22,
                title: `${emoji.group} ${isReSetup ? 'إعادة إعداد' : 'إعداد'} فئة القرآن`,
                description: `تم ${isReSetup ? 'تحديث' : 'إنشاء'} الفئة والقنوات بنجاح`,
                fields: [
                    {
                        name: 'الصوتي',
                        value: `<#${setupResult.voiceChannel.id}>`,
                        inline: true,
                    },
                    {
                        name: 'النصي',
                        value: `<#${setupResult.textChannel.id}>`,
                        inline: true,
                    },
                    {
                        name: 'الأذكار',
                        value: `<#${setupResult.azkarChannel.id}>`,
                        inline: true,
                    },
                    {
                        name: 'الفئة',
                        value: `<#${setupResult.category.id}>`,
                        inline: true,
                    },
                ],
            },
        ],
    };
}

async function sendSuccessMessage(interaction, setupResult, isReSetup, channelWillBeDeleted) {
    const successEmbed = buildSuccessEmbed(setupResult, isReSetup);
    const replyTarget = channelWillBeDeleted ? interaction.guild.systemChannel : interaction.channel;

    if (replyTarget) {
        await replyTarget
            .send({
                content: channelWillBeDeleted ? `إعادة إعداد مكتملة من <@${interaction.user.id}> تحقق من قناة التحكم في فئة quran` : null,
                embeds: successEmbed.embeds,
            })
            .catch(() => {});
    }
}

module.exports.buildSuccessEmbed = buildSuccessEmbed;
module.exports.sendSuccessMessage = sendSuccessMessage;
