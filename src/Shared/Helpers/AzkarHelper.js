// remove annotation chars from dhikr text
function clean_Dhikr(text) {
    if (!text || typeof text != 'string') return text;
    let t = text
        .replace(/\(\(|\)\)|﴾|﴿|\[|\]/g, '')
        .replace(/ـ+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    return t;
}

module.exports = { clean_Dhikr };
