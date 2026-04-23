require('pathlra-aliaser')();
const {
   ActionRowBuilder,
   ButtonBuilder,
   ButtonStyle,
   StringSelectMenuBuilder,
   StringSelectMenuOptionBuilder,
} = require('discord.js');
const { getCurrentDurations } = require('@audioUtils-core_utils');

function truncateText(text, maxLength) {
   if (!text) return '';
   const str = String(text);
   if (str.length > maxLength) {
      return str.substring(0, maxLength);
   }
   return str;
}

function createReciterRow(state) {
   const RECITERS_PER_PAGE = 25;
   const allReciterKeys = Object.keys(global.reciters || {});
   const sortedReciterKeys = allReciterKeys.sort((a, b) => {
      const nameA = (global.reciters[a].name || '').trim();
      const nameB = (global.reciters[b].name || '').trim();
      return nameA.localeCompare(nameB, 'ar');
   });
   const totalReciterPages = Math.ceil(sortedReciterKeys.length / RECITERS_PER_PAGE);
   const startIndex = state.currentReciterPage * RECITERS_PER_PAGE;
   const endIndex = Math.min(startIndex + RECITERS_PER_PAGE, sortedReciterKeys.length);
   let pageOptions = sortedReciterKeys.slice(startIndex, endIndex).map((key, index) => {
      const rec = global.reciters[key];
      const globalIndex = startIndex + index + 1;
      let label = `${rec.name}`;
      if (label.length > 100) {
         label = `${globalIndex} ${rec.name.substring(0, 97 - `${globalIndex} `.length)}`;
      }
      const description = truncateText(`قارئ رقم ${globalIndex}`, 100);
      return new StringSelectMenuOptionBuilder()
         .setLabel(truncateText(label, 100))
         .setValue(truncateText(key, 100))
         .setDescription(description);
   });
   if (pageOptions.length === 0) {
      if (sortedReciterKeys.length > 0) {
         state.currentReciterPage = 0;
         return createReciterRow(state);
      } else {
         pageOptions = [
            new StringSelectMenuOptionBuilder()
               .setLabel('لا توجد قراء متاحة')
               .setValue('no_reciters')
               .setDescription('يرجى المحاولة لاحقا'),
         ];
      }
   }
   const currentPage = state.currentReciterPage + 1;
   const totalPages = totalReciterPages;
   const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_reciter')
      .setPlaceholder(truncateText(`اختر القارئ الصفحة ${currentPage}/${totalPages}`, 100))
      .addOptions(pageOptions);
   return new ActionRowBuilder().addComponents(selectMenu);
}

function createRadioRow(state) {
   const ITEMS_PER_PAGE = 25;
   const totalPages = Math.ceil((global.quranRadios || []).length / ITEMS_PER_PAGE);
   const currentPage = state.currentRadioPage || 0;
   const startIndex = currentPage * ITEMS_PER_PAGE;
   const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, (global.quranRadios || []).length);
   let pageOptions = (global.quranRadios || []).slice(startIndex, endIndex).map((radio, index) => {
      const globalIndex = startIndex + index;
      let label = `${globalIndex + 1} ${radio.name}`;
      if (label.length > 95) {
         label = `${globalIndex + 1} ${radio.name.substring(0, 92 - `${globalIndex + 1} `.length)}`;
      }
      return new StringSelectMenuOptionBuilder()
         .setLabel(truncateText(label, 100))
         .setValue(truncateText(globalIndex.toString(), 100))
         .setDescription(truncateText(`محطة ${globalIndex + 1}`, 100));
   });
   if (pageOptions.length === 0) {
      if ((global.quranRadios || []).length > 0) {
         state.currentRadioPage = 0;
         return createRadioRow(state);
      } else {
         pageOptions = [
            new StringSelectMenuOptionBuilder()
               .setLabel('لا توجد محطات راديو متاحة')
               .setValue('no_radios')
               .setDescription('يرجى المحاولة لاحقا'),
         ];
      }
   }
   const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_radio')
      .setPlaceholder(truncateText(`اختر راديو قرآن الصفحة ${currentPage + 1}/${totalPages}`, 100))
      .addOptions(pageOptions);
   return new ActionRowBuilder().addComponents(selectMenu);
}

function createSelectRow(state) {
   const OPTIONS_PER_PAGE = 25;
   const totalPages = Math.ceil((global.surahNames || []).length / OPTIONS_PER_PAGE);
   const startIndex = state.currentPage * OPTIONS_PER_PAGE;
   const endIndex = Math.min(startIndex + OPTIONS_PER_PAGE, (global.surahNames || []).length);
   let pageOptions = (global.surahNames || []).slice(startIndex, endIndex).map((name, index) => {
      const globalIndex = startIndex + index;
      let label = name;
      if (label.length > 100) {
         label = label.substring(0, 100);
      }
      const value = (globalIndex + 1).toString();
      return new StringSelectMenuOptionBuilder()
         .setLabel(truncateText(label, 100))
         .setValue(truncateText(value, 100))
         .setDescription(truncateText(`رقم سور ${globalIndex + 1}`, 100));
   });
   if (pageOptions.length === 0) {
      if ((global.surahNames || []).length > 0) {
         state.currentPage = 0;
         return createSelectRow(state);
      } else {
         pageOptions = [
            new StringSelectMenuOptionBuilder()
               .setLabel('لا توجد سور متاحة')
               .setValue('no_surahs')
               .setDescription('يرجى المحاولة لاحقا'),
         ];
      }
   }
   const currentPage = state.currentPage + 1;
   const finalTotalPages = Math.ceil((global.surahNames || []).length / OPTIONS_PER_PAGE);
   const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_surah')
      .setPlaceholder(truncateText(`اختر السورة الصفحة ${currentPage}/${finalTotalPages}`, 100))
      .addOptions(pageOptions);
   return new ActionRowBuilder().addComponents(selectMenu);
}

function createButtonRow(state) {
   const isSurahMode = state.playbackMode === 'surah';
   return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
         .setCustomId('prev')
         .setLabel(truncateText('السابقة', 80))
         .setStyle(ButtonStyle.Secondary)
         .setDisabled(!isSurahMode),
      new ButtonBuilder().setCustomId('pause').setLabel(truncateText('ايقاف', 80)).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('resume').setLabel(truncateText('ابدأ', 80)).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
         .setCustomId('next')
         .setLabel(truncateText('التالي', 80))
         .setStyle(ButtonStyle.Secondary)
         .setDisabled(!isSurahMode),
      new ButtonBuilder()
         .setCustomId('toggle_radio')
         .setLabel(truncateText(isSurahMode ? 'راديو' : 'قرآن', 80))
         .setStyle(ButtonStyle.Secondary),
   );
}

function createNavigationRow(state, guildId) {
   const totalPages = Math.ceil((global.surahNames || []).length / 25);
   const totalReciterPages = Math.ceil(Object.keys(global.reciters || {}).length / 25);
   const isSurahMode = state.playbackMode === 'surah';
   const canGoPrev = state.currentPage > 0 && isSurahMode;
   const canGoNext = state.currentPage < totalPages - 1 && isSurahMode;
   const canGoPrevReciter = state.currentReciterPage > 0 && isSurahMode;
   const canGoNextReciter = state.currentReciterPage < totalReciterPages - 1 && isSurahMode;
   const navRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
         .setCustomId('prev_page')
         .setLabel(truncateText('صفحة سابقة سور', 80))
         .setStyle(ButtonStyle.Secondary)
         .setDisabled(!canGoPrev),
      new ButtonBuilder()
         .setCustomId('next_page')
         .setLabel(truncateText('صفحة تالية سور', 80))
         .setStyle(ButtonStyle.Secondary)
         .setDisabled(!canGoNext),
      new ButtonBuilder()
         .setCustomId('prev_reciter_page')
         .setLabel(truncateText('صفحة سابقة قراء', 80))
         .setStyle(ButtonStyle.Secondary)
         .setDisabled(!canGoPrevReciter),
      new ButtonBuilder()
         .setCustomId('next_reciter_page')
         .setLabel(truncateText('صفحة تالية قراء', 80))
         .setStyle(ButtonStyle.Secondary)
         .setDisabled(!canGoNextReciter),
   );
   const toggleControlButton = new ButtonBuilder()
      .setCustomId('toggle_control_mode')
      .setLabel(
         truncateText(
            state.controlMode === 'everyone' ? 'وضع التحكم تبديل إلى أدمنز فقط' : 'وضع التحكم تبديل إلى الجميع',
            80,
         ),
      )
      .setStyle(ButtonStyle.Secondary);
   const complaintButton = new ButtonBuilder()
      .setCustomId('submit_complaint')
      .setLabel('تقديم شكوى او اقتراح')
      .setStyle(ButtonStyle.Secondary);
   const moreFeaturesButton = new ButtonBuilder()
      .setCustomId('more_features')
      .setLabel(truncateText('المزيد', 80))
      .setStyle(ButtonStyle.Secondary);
   const entryRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('join_vc').setLabel(truncateText('دخول', 80)).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('leave_vc').setLabel(truncateText('خروج', 80)).setStyle(ButtonStyle.Secondary),
      toggleControlButton,
      complaintButton,
      moreFeaturesButton,
   );
   const rows = [];
   if (isSurahMode) {
      rows.push(navRow);
   }
   if (!isSurahMode) {
      const totalRadioPages = Math.ceil((global.quranRadios || []).length / 25);
      const canGoPrevRadio = (state.currentRadioPage || 0) > 0;
      const canGoNextRadio = (state.currentRadioPage || 0) < totalRadioPages - 1;
      const radioNavRow = new ActionRowBuilder().addComponents(
         new ButtonBuilder()
            .setCustomId('prev_radio_page')
            .setLabel(truncateText('صفحة سابقة راديو', 80))
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(!canGoPrevRadio),
         new ButtonBuilder()
            .setCustomId('next_radio_page')
            .setLabel(truncateText('صفحة تالية راديو', 80))
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(!canGoNextRadio),
      );
      rows.push(radioNavRow);
   }
   rows.push(entryRow);
   return rows;
}

function createPrayerTimesButtonRow() {
   const prayerTimesButton = new ButtonBuilder()
      .setCustomId('prayer_times')
      .setLabel('مواقيت الصلاة')
      .setStyle(ButtonStyle.Secondary);
   return new ActionRowBuilder().addComponents(prayerTimesButton);
}

module.exports.createReciterRow = createReciterRow;
module.exports.createRadioRow = createRadioRow;
module.exports.createSelectRow = createSelectRow;
module.exports.createButtonRow = createButtonRow;
module.exports.createNavigationRow = createNavigationRow;
module.exports.createPrayerTimesButtonRow = createPrayerTimesButtonRow;
