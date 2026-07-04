const fetch = require('node-fetch').default;
const logger = require('@logging/logger');
const { getApiHeaders, TimeoutRequest } = require('@config/http');
const stripHtml = require('@helpers/stripHtml');

let chaptersCache = null;
let chaptersCacheTimestamp = 0;

function stripTashkeel(text) {
    if (!text) return '';
    return text.replace(/[\u064B-\u0652]/g, '');
}

function containsExactWord(text, keyword) {
    if (!text || !keyword) return false;
    const cleanText = stripTashkeel(text);
    const cleanKeyword = stripTashkeel(keyword);
    const escapedKeyword = cleanKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\s|[^\\u0600-\\u06FF])${escapedKeyword}($|\\s|[^\\u0600-\\u06FF])`, 'i');
    return regex.test(cleanText);
}

async function fetchChapters() {
    if (chaptersCache && Date.now() - chaptersCacheTimestamp < 24 * 60 * 60 * 1000) {
        return chaptersCache;
    }
    try {
        const res = await fetch(`https://api.quran.com/api/v4/chapters?language=ar`, {
            headers: getApiHeaders(),
            timeout: TimeoutRequest('default'),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        chaptersCache = data.chapters.map((ch) => ({ ...ch, id: Number(ch.id) })).sort((a, b) => a.id - b.id);
        chaptersCacheTimestamp = Date.now();

        return chaptersCache;
    } catch (err) {
        logger.error('Failed to fetch quran.com API', err);
        return [];
    }
}

async function fetchVerse(chapterId, verseNumber) {
    try {
        const verseKey = `${chapterId}:${verseNumber}`;
        const verseRes = await fetch(`https://api.quran.com/api/v4/verses/by_key/${verseKey}?fields=text_uthmani`, {
            headers: getApiHeaders(),
            timeout: TimeoutRequest('default'),
        });

        if (!verseRes.ok) throw new Error(`HTTP ${verseRes.status}`);

        const verseData = await verseRes.json();
        const verse = verseData.verse;

        const tafsirRes = await fetch(`https://api.quran.com/api/v4/tafsirs/16/by_ayah/${verseKey}`, {
            headers: getApiHeaders(),
            timeout: TimeoutRequest('default'),
        });

        if (tafsirRes.ok) {
            const tafsirData = await tafsirRes.json();
            verse.tafsir_text = stripHtml(tafsirData.tafsir?.text) || null;
        }
        return verse;
    } catch (err) {
        logger.error(`Failed to fetch verse ${chapterId}:${verseNumber}`, err);
        return null;
    }
}

async function fetchFullSurah(surahNumber) {
    try {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`, {
            headers: getApiHeaders(),
            timeout: TimeoutRequest('default'),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (data.code === 200 && data.data && data.data.ayahs) {
            return data.data.ayahs.map((a) => a.text).join('\n');
        }

        return null;
    } catch (err) {
        logger.error(`Failed to fetch full surah ${surahNumber}`, err);
        return null;
    }
}

async function searchQuran(keyword) {
    if (!keyword || typeof keyword !== 'string') {
        return { success: false, error: 'كلمة البحث غير صالحة' };
    }
    try {
        const cleanKeyword = stripTashkeel(keyword.trim());
        const encodedKeyword = encodeURIComponent(cleanKeyword);

        const res = await fetch(`https://api.alquran.cloud/v1/search/${encodedKeyword}/all/ar`, {
            headers: getApiHeaders(),
            timeout: TimeoutRequest('default'),
        });

        if (!res.ok) {
            if (res.status === 404) {
                return { success: true, count: 0, matches: [] };
            }
            if (res.status === 500) {
                logger.warn(`Search API returned 500 for keyword: ${cleanKeyword}`);
                return { success: false, error: 'تعذر البحث عن هذه الكلمة (قد تكون شائعة جداً أو الخادم الخارجي يواجه مشكلة)' };
            }
            throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data.code !== 200 || !data.data) {
            return { success: false, error: 'استجابة غير صالحة من الخادم' };
        }
        const allMatches = data.data.matches || [];
        const exactMatches = allMatches.filter((match) => containsExactWord(match.text, cleanKeyword));
        return {
            success: true,
            count: exactMatches.length,
            matches: exactMatches,
        };
    } catch (err) {
        logger.error(`Failed to search Quran for keyword: ${keyword}`, err);
        return { success: false, error: 'فشل في البحث، يرجى المحاولة لاحقاً' };
    }
}

module.exports.fetchChapters = fetchChapters;
module.exports.fetchVerse = fetchVerse;
module.exports.searchQuran = searchQuran;
module.exports.fetchFullSurah = fetchFullSurah;
