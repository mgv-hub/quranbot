const { emoji } = require('@helpers/emojis');

const searchCache = new Map();

function getSearchCache(id) {
    const data = searchCache.get(id);
    if (!data) return null;
    if (Date.now() - data.timestamp > 15 * 60 * 1000) {
        searchCache.delete(id);
        return null;
    }
    return data;
}

function setSearchCache(id, matches, keyword) {
    searchCache.set(id, { matches, keyword, timestamp: Date.now() });
}

setInterval(() => {
    const now = Date.now();
    for (const [key, data] of searchCache.entries()) {
        if (now - data.timestamp > 15 * 60 * 1000) {
            searchCache.delete(key);
        }
    }
}, 60 * 1000);

function buildComponents(searchId, keyword, matches, page) {
    const totalPages = Math.ceil(matches.length / 5);
    const start = page * 5;
    const end = Math.min(start + 5, matches.length);
    const pageMatches = matches.slice(start, end);

    const warning =
        '> **تنويه هام:** يعتمد البوت على واجهة برمجية خارجية لجلب النصوص، وقد تظهر أحياناً نصوص تفسيرية أو حواشي مدمجة مع الآيات في بعض النتائج وليست من نص القرآن الكريم بسبب بيانات المصدر الخارجي.';
    const sourceText = '*المصدر: api.alquran.cloud*';

    const maxResultsLength = 3600;
    let resultsText = '';

    for (let i = 0; i < pageMatches.length; i++) {
        const m = pageMatches[i];
        const surahName = m.surah?.name || `سورة ${m.surah?.number}`;
        const surahNum = m.surah?.number || '?';
        const ayahNum = m.numberInSurah || '?';
        const text = m.text || '';
        const block = `**سُورَةُ ${surahName} (رقم ${surahNum}) - الآية ${ayahNum}**\n${text}\n\n`;

        if (resultsText.length + block.length > maxResultsLength) {
            if (resultsText.length === 0) {
                resultsText = block.substring(0, maxResultsLength - 50) + '\n*تم اختصار هذه النتيجة بسبب طول المحتوى.*';
            } else {
                resultsText += '*... توجد نتائج أخرى، يرجى الضغط على زر "التالي" لعرضها.*';
            }
            break;
        }
        resultsText += block;
    }

    const headerText = `### ${emoji.search} نتائج البحث عن: "${keyword}"\n**عدد النتائج:** ${matches.length} مرة | **الصفحة:** ${page + 1}/${totalPages}\n\n`;
    let fullContent = headerText + resultsText + '\n' + warning + '\n' + sourceText;

    if (fullContent.length > 3950) {
        fullContent = fullContent.substring(0, 3940) + '...';
    }

    return {
        flags: 32832,
        components: [
            {
                type: 17,
                accent_color: 0xfefdfe,
                components: [
                    { type: 10, content: fullContent },
                    { type: 14, divider: true, spacing: 1 },
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                custom_id: `search_prev_${searchId}_${page - 1}`,
                                label: 'رجوع',
                                style: 2,
                                disabled: page === 0,
                            },
                            {
                                type: 2,
                                custom_id: `search_next_${searchId}_${page + 1}`,
                                label: 'التالي',
                                style: 2,
                                disabled: page >= totalPages - 1,
                            },
                        ],
                    },
                ],
            },
        ],
    };
}

module.exports.getSearchCache = getSearchCache;
module.exports.setSearchCache = setSearchCache;
module.exports.buildComponents = buildComponents;
