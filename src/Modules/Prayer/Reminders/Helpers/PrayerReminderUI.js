const {
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ChannelSelectMenuBuilder,
    RoleSelectMenuBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
} = require('discord.js');
const { emoji } = require('@shared/Helpers/Emojis');

function buildCountrySelect(countries, page = 0) {
    const safeCountries = Array.isArray(countries) ? countries : [];
    const perPage = 25;
    const start = page * perPage;
    const end = Math.min(start + perPage, safeCountries.length);
    const slice = safeCountries.slice(start, end);

    const options = slice.map((c) =>
        new StringSelectMenuOptionBuilder()
            .setLabel(c.name.substring(0, 100))
            .setValue(c.code)
            .setDescription(c.nameEn.substring(0, 100))
            .setEmoji(c.flag || '🌍'),
    );

    if (options.length === 0) {
        options.push(new StringSelectMenuOptionBuilder().setLabel('لا توجد دول متاحة').setValue('no_countries'));
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('pr_reminder_select_country')
        .setPlaceholder('اختر الدولة')
        .addOptions(options)
        .setMinValues(1)
        .setMaxValues(1);

    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
    const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`pr_reminder_prev_country_${page - 1}`)
            .setLabel('السابق')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
        new ButtonBuilder()
            .setCustomId(`pr_reminder_next_country_${page + 1}`)
            .setLabel('التالي')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(end >= safeCountries.length),
        new ButtonBuilder().setCustomId('pr_reminder_cancel').setLabel('إلغاء').setStyle(ButtonStyle.Secondary),
    );

    return {
        type: 17,
        accent_color: 0xfefdfe,
        components: [
            { type: 10, content: `### ${emoji.globe} الخطوة 1: اختر الدولة` },
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: 'يرجى اختيار الدولة التي تنتمي إليها منطقتك لحساب مواقيت الصلاة بدقة.' },
            { type: 14, divider: true, spacing: 1 },
            selectRow.toJSON(),
            navRow.toJSON(),
        ],
    };
}

function buildCitySelect(cities, countryCode) {
    const safeCities = Array.isArray(cities) ? cities : [];
    const options = safeCities
        .slice(0, 25)
        .map((c, i) =>
            new StringSelectMenuOptionBuilder()
                .setLabel(c.name.substring(0, 100))
                .setValue(`${countryCode}_${i}`)
                .setDescription(c.nameEn.substring(0, 100)),
        );

    if (options.length === 0) {
        options.push(new StringSelectMenuOptionBuilder().setLabel('لا توجد مدن متاحة').setValue('no_cities'));
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('pr_reminder_select_city')
        .setPlaceholder('اختر المدينة')
        .addOptions(options)
        .setMinValues(1)
        .setMaxValues(1);

    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
    const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('pr_reminder_back_country').setLabel('رجوع').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('pr_reminder_cancel').setLabel('إلغاء').setStyle(ButtonStyle.Secondary),
    );

    return {
        type: 17,
        accent_color: 0xfefdfe,
        components: [
            { type: 10, content: `### ${emoji.globe} الخطوة 2: اختر المدينة` },
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: 'يرجى اختيار المدينة أو المحافظة.' },
            { type: 14, divider: true, spacing: 1 },
            selectRow.toJSON(),
            navRow.toJSON(),
        ],
    };
}

function buildPrayerSelect() {
    const options = [
        new StringSelectMenuOptionBuilder().setLabel('الفجر').setValue('fajr').setDescription('تذكير بأذان الفجر'),
        new StringSelectMenuOptionBuilder().setLabel('الظهر').setValue('dhuhr').setDescription('تذكير بأذان الظهر'),
        new StringSelectMenuOptionBuilder().setLabel('العصر').setValue('asr').setDescription('تذكير بأذان العصر'),
        new StringSelectMenuOptionBuilder().setLabel('المغرب').setValue('maghrib').setDescription('تذكير بأذان المغرب'),
        new StringSelectMenuOptionBuilder().setLabel('العشاء').setValue('isha').setDescription('تذكير بأذان العشاء'),
    ];

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('pr_reminder_select_prayers')
        .setPlaceholder('اختر الصلوات')
        .addOptions(options)
        .setMinValues(1)
        .setMaxValues(5);

    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
    const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('pr_reminder_back_city').setLabel('رجوع').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('pr_reminder_cancel').setLabel('إلغاء').setStyle(ButtonStyle.Secondary),
    );

    return {
        type: 17,
        accent_color: 0xfefdfe,
        components: [
            { type: 10, content: `### ${emoji.prayer_times} الخطوة 3: اختر الصلوات` },
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: 'اختر الصلوات التي تريد التذكير بها. يمكنك اختيار صلاة واحدة أو جميع الصلوات.' },
            { type: 14, divider: true, spacing: 1 },
            selectRow.toJSON(),
            navRow.toJSON(),
        ],
    };
}

function buildChannelPrompt(session, hasCategory) {
    const promptText = hasCategory
        ? 'لقد وجدت فئة الإعدادات الخاصة بالبوت (`🕋︱القُرآن الكريم`). هل تريد إنشاء قناة التذكيرات داخلها تلقائياً؟'
        : 'لم يتم العثور على فئة الإعدادات. هل تريد إنشاء الفئة والقناة تلقائياً؟';

    return {
        type: 17,
        accent_color: 0xfefdfe,
        components: [
            { type: 10, content: `### ${emoji.chat} الخطوة 4: إعداد القناة` },
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: promptText },
            { type: 14, divider: true, spacing: 1 },
            {
                type: 1,
                components: [
                    new ButtonBuilder().setCustomId('pr_reminder_auto_channel').setLabel('إنشاء تلقائي').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('pr_reminder_manual_channel').setLabel('اختيار يدوي').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('pr_reminder_back_prayers').setLabel('رجوع').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('pr_reminder_cancel').setLabel('إلغاء').setStyle(ButtonStyle.Secondary),
                ],
            },
        ],
    };
}

function buildChannelSelect() {
    const selectMenu = new ChannelSelectMenuBuilder()
        .setCustomId('pr_reminder_select_channel')
        .setPlaceholder('اختر القناة')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setMinValues(1)
        .setMaxValues(1);

    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
    const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('pr_reminder_back_channel_prompt').setLabel('رجوع').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('pr_reminder_cancel').setLabel('إلغاء').setStyle(ButtonStyle.Secondary),
    );

    return {
        type: 17,
        accent_color: 0xfefdfe,
        components: [
            { type: 10, content: `### ${emoji.chat} الخطوة 4: اختر القناة` },
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: 'اختر القناة النصية التي سيتم إرسال التذكيرات فيها.' },
            { type: 14, divider: true, spacing: 1 },
            selectRow.toJSON(),
            navRow.toJSON(),
        ],
    };
}

function buildRoleSelect(session) {
    const roleMenu = new RoleSelectMenuBuilder()
        .setCustomId('pr_reminder_select_roles')
        .setPlaceholder('اختر الرتب للمنشن (اختياري، حد أقصى 3)')
        .setMinValues(0)
        .setMaxValues(3);

    const selectRow = new ActionRowBuilder().addComponents(roleMenu);

    const toggleEveryoneBtn = new ButtonBuilder()
        .setCustomId('pr_reminder_toggle_everyone')
        .setLabel(session.mentionEveryone ? 'إلغاء منشن @everyone' : 'منشن @everyone')
        .setStyle(ButtonStyle.Secondary);

    const toggleHereBtn = new ButtonBuilder()
        .setCustomId('pr_reminder_toggle_here')
        .setLabel(session.mentionHere ? 'إلغاء منشن @here' : 'منشن @here')
        .setStyle(ButtonStyle.Secondary);

    const toggleRow = new ActionRowBuilder().addComponents(toggleEveryoneBtn, toggleHereBtn);

    const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('pr_reminder_skip_roles').setLabel('تخطي').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('pr_reminder_back_channel').setLabel('رجوع').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('pr_reminder_cancel').setLabel('إلغاء').setStyle(ButtonStyle.Secondary),
    );

    return {
        type: 17,
        accent_color: 0xfefdfe,
        components: [
            { type: 10, content: `### ${emoji.chat} الخطوة 5: اختر الرتب للمنشن` },
            { type: 14, divider: true, spacing: 1 },
            {
                type: 10,
                content: 'اختر الرتب التي تريد منشنها عند إرسال التذكير (حد أقصى 3 رتب).\nيمكنك أيضاً تفعيل منشن @everyone أو @here.',
            },
            { type: 14, divider: true, spacing: 1 },
            selectRow.toJSON(),
            toggleRow.toJSON(),
            navRow.toJSON(),
        ],
    };
}

function buildConfirm(session, metadata) {
    const prayerNames = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
    const prayersText = session.prayers.map((p) => prayerNames[p]).join('، ');
    const creatorInfo = metadata
        ? `\n**بواسطة:** ${metadata.username} (\`${metadata.userId}\`)\n**اسم القناة:** ${metadata.channelName}`
        : '';

    const mentions = [];
    if (session.mentionEveryone) mentions.push('@everyone');
    if (session.mentionHere) mentions.push('@here');
    if (session.roles && session.roles.length > 0) {
        mentions.push(...session.roles.map((r) => `<@&${r}>`));
    }
    const rolesText = mentions.length > 0 ? mentions.join(' ') : 'لا يوجد';

    return {
        type: 17,
        accent_color: 0xfefdfe,
        components: [
            { type: 10, content: `### ${emoji.check} تأكيد الإعداد` },
            { type: 14, divider: true, spacing: 1 },
            {
                type: 10,
                content: `**الدولة:** ${session.countryName}\n**المدينة:** ${session.cityName}\n**الصلوات:** ${prayersText}\n**القناة:** <#${session.channelId}>\n**المنشن:** ${rolesText}\n**التوقيت:** قبل الأذان بـ 5 دقائق${creatorInfo}`,
            },
            { type: 14, divider: false, spacing: 2 },
            {
                type: 1,
                components: [
                    { type: 2, custom_id: 'pr_reminder_confirm', label: 'تأكيد وحفظ', style: 2 },
                    { type: 2, custom_id: 'pr_reminder_back_roles', label: 'رجوع', style: 2 },
                    { type: 2, custom_id: 'pr_reminder_cancel', label: 'إلغاء', style: 2 },
                ],
            },
        ],
    };
}

function buildEditMenu(session) {
    const prayerNames = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
    const prayersText = session.prayers.map((p) => prayerNames[p] || p).join('، ');

    const mentions = [];
    if (session.mentionEveryone) mentions.push('@everyone');
    if (session.mentionHere) mentions.push('@here');
    if (session.roles && session.roles.length > 0) {
        mentions.push(...session.roles.map((r) => `<@&${r}>`));
    }
    const rolesText = mentions.length > 0 ? mentions.join(' ') : 'لا يوجد';

    return {
        type: 17,
        accent_color: 0xfefdfe,
        components: [
            { type: 10, content: `### ${emoji.settings} تعديل بيانات التذكير` },
            { type: 14, divider: true, spacing: 1 },
            {
                type: 10,
                content: `**البيانات الحالية:**\n**الدولة:** ${session.countryName}\n**المدينة:** ${session.cityName}\n**الصلوات:** ${prayersText}\n**القناة:** <#${session.channelId}>\n**المنشن:** ${rolesText}`,
            },
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: 'اختر الخطوة التي تريد تعديلها:' },
            { type: 14, divider: false, spacing: 2 },
            {
                type: 1,
                components: [
                    new ButtonBuilder().setCustomId('pr_reminder_edit_country').setLabel('تعديل الدولة').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('pr_reminder_edit_city').setLabel('تعديل المدينة').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('pr_reminder_edit_prayers').setLabel('تعديل الصلوات').setStyle(ButtonStyle.Secondary),
                ],
            },
            {
                type: 1,
                components: [
                    new ButtonBuilder().setCustomId('pr_reminder_edit_channel').setLabel('تعديل القناة').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('pr_reminder_edit_roles').setLabel('تعديل الرتب').setStyle(ButtonStyle.Secondary),
                ],
            },
            {
                type: 1,
                components: [
                    new ButtonBuilder().setCustomId('pr_reminder_edit_save').setLabel('حفظ التعديلات').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('pr_reminder_edit_cancel').setLabel('إلغاء التعديل').setStyle(ButtonStyle.Secondary),
                ],
            },
        ],
    };
}

module.exports.buildCountrySelect = buildCountrySelect;
module.exports.buildCitySelect = buildCitySelect;
module.exports.buildPrayerSelect = buildPrayerSelect;
module.exports.buildChannelPrompt = buildChannelPrompt;
module.exports.buildChannelSelect = buildChannelSelect;
module.exports.buildRoleSelect = buildRoleSelect;
module.exports.buildConfirm = buildConfirm;
module.exports.buildEditMenu = buildEditMenu;
