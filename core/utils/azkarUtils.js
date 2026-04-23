require('pathlra-aliaser')();

function clean_Dhikr(text) {
   if (!text || typeof text !== 'string') return text;
   let cleaned = text;
   cleaned = cleaned.replace(/\(\(/g, '');
   cleaned = cleaned.replace(/\)\)/g, '');
   cleaned = cleaned.replace(/﴾/g, '');
   cleaned = cleaned.replace(/﴿/g, '');
   cleaned = cleaned.replace(/\[/g, '');
   cleaned = cleaned.replace(/\]/g, '');
   cleaned = cleaned.replace(/ـ+/g, '');
   cleaned = cleaned.trim();
   cleaned = cleaned.replace(/\s+/g, ' ');
   return cleaned;
}

module.exports.clean_Dhikr = clean_Dhikr;
