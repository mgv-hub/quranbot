const { ChannelType, PermissionsBitField, SlashCommandBuilder, Routes, REST } = require('discord.js');
const logger = require('@logging/logger');

const setup = String(
    PermissionsBitField.Flags.Connect |
        PermissionsBitField.Flags.Speak |
        PermissionsBitField.Flags.ManageChannels |
        PermissionsBitField.Flags.ManageRoles |
        PermissionsBitField.Flags.ViewChannel,
);

const control = String(
    PermissionsBitField.Flags.Connect |
        PermissionsBitField.Flags.Speak |
        PermissionsBitField.Flags.SendMessages |
        PermissionsBitField.Flags.ManageChannels |
        PermissionsBitField.Flags.ViewChannel,
);

const connect = String(
    PermissionsBitField.Flags.ViewChannel |
        PermissionsBitField.Flags.SendMessages |
        PermissionsBitField.Flags.Connect |
        PermissionsBitField.Flags.Speak |
        PermissionsBitField.Flags.ManageChannels |
        PermissionsBitField.Flags.ManageRoles,
);

async function registerCommands() {
    const cmds = [
        new SlashCommandBuilder().setName('دليل').setDescription('دليل استخدام البوت وخيارات الإعداد'),
        new SlashCommandBuilder()
            .setName('دخول')
            .setDescription('الانضمام إلى الروم الصوتي المعد من الإعداد')
            .setDefaultMemberPermissions(connect),
        new SlashCommandBuilder()
            .setName('دخول_قناة')
            .setDescription('الانضمام إلى غرفة صوتية محددة')
            .addChannelOption((opt) =>
                opt.setName('قناة').setDescription('اختر الغرفة الصوتية').addChannelTypes(ChannelType.GuildVoice).setRequired(true),
            )
            .setDefaultMemberPermissions(control),
        new SlashCommandBuilder()
            .setName('تعيين_القنوات')
            .setDescription('تعيين أو إصلاح قنوات البوت (الصوت، التحكم، الأذكار) بدون الحاجة لإعادة الإعداد')
            .setDefaultMemberPermissions(setup),
        new SlashCommandBuilder().setName('خروج').setDescription('الخروج من الروم الصوتي').setDefaultMemberPermissions(connect),
        new SlashCommandBuilder().setName('تحكم').setDescription('لوحة التحكم للقرآن').setDefaultMemberPermissions(control),
        new SlashCommandBuilder().setName('إعداد').setDescription('إعداد فئة القرآن مع القنوات').setDefaultMemberPermissions(setup),
        new SlashCommandBuilder().setName('سرعة').setDescription('يعرض سرعة البوت ومدة التشغيل والساعات وعدد السيرفرات الحالي'),
        new SlashCommandBuilder().setName('مواقيت_الصلاة').setDescription('عرض مواقيت الصلاة لجميع الدول والمناطق'),
        new SlashCommandBuilder().setName('مصادر').setDescription('عرض مصادر المعلومات والروابط التي يستخدمها البوت'),
        new SlashCommandBuilder().setName('تحديثات').setDescription('عرض سجل التحديثات الأخيرة والتغييرات المعمارية في البوت'),
        new SlashCommandBuilder().setName('مساعدة').setDescription('عرض جميع الروابط الرسمية للبوت'),
        new SlashCommandBuilder().setName('تفسير').setDescription('عرض آية من القرآن مع التفسير'),
        //   new SlashCommandBuilder()
        //       .setName('بحث')
        //       .setDescription('البحث في نصوص التفسير وعرض عدد النتائج')
        //       .addStringOption((opt) => opt.setName('كلمة').setDescription('الكلمة المراد البحث عنها').setRequired(true).setMaxLength(50)),
        new SlashCommandBuilder()
            .setName('سورة')
            .setDescription('عرض النص الكامل لسورة من القرآن الكريم')
            .addStringOption((opt) => opt.setName('سورة').setDescription('اسم أو رقم السورة (1-114)').setRequired(true)),
        new SlashCommandBuilder().setName('المسباح').setDescription('عرض صيغة من صيغ التسبيح والأذكار مع إمكانية العد والتكرار'),
    ].map((c) => c.toJSON());

    const rest = new REST({ version: '10' }).setToken(global.token);
    try {
        await rest.put(Routes.applicationCommands(global.clientId), { body: cmds });
        logger.info(`Registered ${cmds.length} commands`);
    } catch (err) {
        logger.error('Failed to register commands', err);
    }
}
async function applyCommandPermissions(guild) {
    const rest = new REST({ version: '10' }).setToken(global.token);
    try {
        const guildCmds = await rest.get(Routes.applicationGuildCommands(global.clientId, guild.id));
        const restricted = ['دخول', 'دخول_قناة', 'خروج', 'إعداد'];

        for (const cmd of guildCmds) {
            if (!restricted.includes(cmd.name)) continue;

            const perms = [];
            // add special user if exists
            if (global.SPE_USER_ID) {
                perms.push({ id: global.SPE_USER_ID, type: 2, permission: true });
            }

            let permId = guild.roles.cache.find((r) => r.name === 'Quran Admin')?.id;
            let permType = 1;

            if (!permId) {
                permId = guild.members.cache.find((m) => m.permissions.has(PermissionsBitField.Flags.Administrator))?.id;
                permType = 2;
            }

            if (permId) {
                perms.push({ id: permId, type: permType, permission: true });
            }

            await rest.put(Routes.guildCommandPermissions(global.clientId, guild.id, cmd.id), {
                body: { permissions: perms },
            });
        }
    } catch (err) {
        logger.error(`Perm apply failed for guild ${guild.id}`, err);
    }
}

module.exports = { registerCommands, applyCommandPermissions };
