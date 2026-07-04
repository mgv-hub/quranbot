// Formats number to compact string (K, M, B)
function formatCompactNumber(num) {
    // basic check
    if (typeof num != 'number' || isNaN(num)) return '0';
    // save sign and work with positive
    let sign = num < 0 ? '-' : '';
    let val = Math.abs(num);
    // no need to format small numbers
    if (val < 1000) return `${sign}${val}`;
    // billions
    if (val >= 1e9) {
        let v = val / 1e9;
        let out = v < 10 ? v.toFixed(1) : Math.round(v);
        // Convert to string before replace to safely handle Math.round number output
        return `${sign}${String(out).replace(/\.0$/, '')}B`;
    }
    // millions
    else if (val >= 1e6) {
        let v = val / 1e6;
        let out = v < 10 ? v.toFixed(1) : Math.round(v);
        return `${sign}${String(out).replace(/\.0$/, '')}M`;
    }
    // thousands
    else if (val >= 1e3) {
        let v = val / 1e3;
        let out = v < 10 ? v.toFixed(1) : Math.round(v);
        return `${sign}${String(out).replace(/\.0$/, '')}K`;
    }
    // fallback (just in case)
    return `${sign}${val}`;
}

module.exports = formatCompactNumber;
