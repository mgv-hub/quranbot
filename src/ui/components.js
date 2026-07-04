const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { getCurrentDurations } = require('@audio');

function truncateText(t, max) {
    if (!t) return '';
    const s = String(t);
    return s.length > max ? s.substring(0, max) : s;
}

// reciter dropdown with pagination
function createReciterRow(st) {
    const PER_PAGE = 25;
    const keys = Object.keys(global.reciters || {}).sort((a, b) =>
        (global.reciters[a].name || '').trim().localeCompare((global.reciters[b].name || '').trim(), 'ar'),
    );

    const total = Math.ceil(keys.length / PER_PAGE);
    const start = st.currentReciterPage * PER_PAGE;
    const end = Math.min(start + PER_PAGE, keys.length);

    let opts = keys.slice(start, end).map((k, i) => {
        const r = global.reciters[k];
        const idx = start + i + 1;
        let lbl = `${r.name}`;
        if (lbl.length > 100) lbl = `${idx} ${r.name.substring(0, 97 - `${idx} `.length)}`;
        return new StringSelectMenuOptionBuilder()
            .setLabel(truncateText(lbl, 100))
            .setValue(truncateText(k, 100))
            .setDescription(truncateText(`قارئ رقم ${idx}`, 100));
    });

    if (!opts.length) {
        if (keys.length) {
            st.currentReciterPage = 0;
            return createReciterRow(st);
        }
        opts = [
            new StringSelectMenuOptionBuilder()
                .setLabel('لا توجد قراء متاحة')
                .setValue('no_reciters')
                .setDescription('يرجى المحاولة لاحقا'),
        ];
    }

    const cur = st.currentReciterPage + 1;
    const menu = new StringSelectMenuBuilder()
        .setCustomId('select_reciter')
        .setPlaceholder(truncateText(`اختر القارئ الصفحة ${cur}/${total}`, 100))
        .addOptions(opts);
    return new ActionRowBuilder().addComponents(menu);
}

function createRadioRow(st) {
    const PER_PAGE = 25;
    const radios = global.quranRadios || [];
    const total = Math.ceil(radios.length / PER_PAGE);
    const curPage = st.currentRadioPage || 0;
    const start = curPage * PER_PAGE;
    const end = Math.min(start + PER_PAGE, radios.length);

    let opts = radios.slice(start, end).map((r, i) => {
        const idx = start + i;
        let lbl = `${r.name}`;
        if (lbl.length > 95) lbl = `${idx + 1} ${r.name.substring(0, 92 - `${idx + 1} `.length)}`;
        return new StringSelectMenuOptionBuilder()
            .setLabel(truncateText(lbl, 100))
            .setValue(truncateText(String(idx), 100))
            .setDescription(truncateText(`محطة ${idx + 1}`, 100));
    });

    if (!opts.length) {
        if (radios.length) {
            st.currentRadioPage = 0;
            return createRadioRow(st);
        }
        opts = [
            new StringSelectMenuOptionBuilder()
                .setLabel('لا توجد محطات راديو متاحة')
                .setValue('no_radios')
                .setDescription('يرجى المحاولة لاحقا'),
        ];
    }

    const menu = new StringSelectMenuBuilder()
        .setCustomId('select_radio')
        .setPlaceholder(truncateText(`اختر راديو قرآن الصفحة ${curPage + 1}/${total}`, 100))
        .addOptions(opts);
    return new ActionRowBuilder().addComponents(menu);
}

function createSelectRow(st) {
    const PER_PAGE = 25;
    const surahs = global.surahNames || [];
    const total = Math.ceil(surahs.length / PER_PAGE);
    const start = st.currentPage * PER_PAGE;
    const end = Math.min(start + PER_PAGE, surahs.length);

    let opts = surahs.slice(start, end).map((name, i) => {
        const idx = start + i;
        let lbl = name;
        if (lbl.length > 100) lbl = lbl.substring(0, 100);
        return new StringSelectMenuOptionBuilder()
            .setLabel(truncateText(lbl, 100))
            .setValue(truncateText(String(idx + 1), 100))
            .setDescription(truncateText(`رقم سور ${idx + 1}`, 100));
    });

    if (!opts.length) {
        if (surahs.length) {
            st.currentPage = 0;
            return createSelectRow(st);
        }
        opts = [
            new StringSelectMenuOptionBuilder().setLabel('لا توجد سور متاحة').setValue('no_surahs').setDescription('يرجى المحاولة لاحقا'),
        ];
    }

    const cur = st.currentPage + 1;
    const menu = new StringSelectMenuBuilder()
        .setCustomId('select_surah')
        .setPlaceholder(truncateText(`اختر السورة الصفحة ${cur}/${total}`, 100))
        .addOptions(opts);
    return new ActionRowBuilder().addComponents(menu);
}

function createButtonRow(st) {
    const isSurah = st.playbackMode === 'surah';
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('prev').setLabel(truncateText('السابقة', 80)).setStyle(ButtonStyle.Secondary).setDisabled(!isSurah),
        new ButtonBuilder().setCustomId('pause').setLabel(truncateText('ايقاف', 80)).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('resume').setLabel(truncateText('ابدأ', 80)).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('next').setLabel(truncateText('التالي', 80)).setStyle(ButtonStyle.Secondary).setDisabled(!isSurah),
        new ButtonBuilder()
            .setCustomId('toggle_radio')
            .setLabel(truncateText(isSurah ? 'راديو' : 'قرآن', 80))
            .setStyle(ButtonStyle.Secondary),
    );
}

function createNavigationRow(st, guildId) {
    const PER_PAGE = 25;
    const totalSurah = Math.ceil((global.surahNames || []).length / PER_PAGE);
    const totalRec = Math.ceil(Object.keys(global.reciters || {}).length / PER_PAGE);
    const isSurah = st.playbackMode === 'surah';

    const navComponents = [
        new ButtonBuilder()
            .setCustomId('prev_page')
            .setLabel(truncateText('صفحة سابقة سور', 80))
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(!(st.currentPage > 0 && isSurah)),
        new ButtonBuilder()
            .setCustomId('next_page')
            .setLabel(truncateText('صفحة تالية سور', 80))
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(!(st.currentPage < totalSurah - 1 && isSurah)),
        new ButtonBuilder()
            .setCustomId('prev_reciter_page')
            .setLabel(truncateText('صفحة سابقة قراء', 80))
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(!(st.currentReciterPage > 0 && isSurah)),
        new ButtonBuilder()
            .setCustomId('next_reciter_page')
            .setLabel(truncateText('صفحة تالية قراء', 80))
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(!(st.currentReciterPage < totalRec - 1 && isSurah)),
    ];
    const nav = new ActionRowBuilder().addComponents(navComponents);
    const toggle = new ButtonBuilder()
        .setCustomId('toggle_control_mode')
        .setLabel(truncateText(st.controlMode === 'everyone' ? 'وضع التحكم تبديل إلى أدمنز فقط' : 'وضع التحكم تبديل إلى الجميع', 80))
        .setStyle(ButtonStyle.Secondary);

    const entry = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('join_vc').setLabel(truncateText('دخول', 80)).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('leave_vc').setLabel(truncateText('خروج', 80)).setStyle(ButtonStyle.Secondary),
        toggle,
        new ButtonBuilder().setCustomId('more_features').setLabel(truncateText('المزيد', 80)).setStyle(ButtonStyle.Secondary),
    );

    const rows = [];
    if (isSurah) rows.push(nav);
    else {
        const totalRadio = Math.ceil((global.quranRadios || []).length / PER_PAGE);
        const curRadio = st.currentRadioPage || 0;
        const radioNav = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('prev_radio_page')
                .setLabel(truncateText('صفحة سابقة راديو', 80))
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(!(curRadio > 0)),
            new ButtonBuilder()
                .setCustomId('next_radio_page')
                .setLabel(truncateText('صفحة تالية راديو', 80))
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(!(curRadio < totalRadio - 1)),
        );
        rows.push(radioNav);
    }
    rows.push(entry);
    return rows;
}

function createPrayerTimesButtonRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('prayer_times').setLabel('مواقيت الصلاة').setStyle(ButtonStyle.Secondary),
    );
}

module.exports.createReciterRow = createReciterRow;
module.exports.createRadioRow = createRadioRow;
module.exports.createSelectRow = createSelectRow;
module.exports.createButtonRow = createButtonRow;
module.exports.createNavigationRow = createNavigationRow;
module.exports.createPrayerTimesButtonRow = createPrayerTimesButtonRow;
