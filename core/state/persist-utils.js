require('pathlra-aliaser');

function isPlainObject(obj) {
   return (
      obj !== null &&
      typeof obj === 'object' &&
      !Array.isArray(obj) &&
      Object.getPrototypeOf(obj) === Object.prototype
   );
}

function deepCloneForFirebase(obj) {
   if (obj === null || typeof obj !== 'object') {
      return obj;
   }
   if (Array.isArray(obj)) {
      return obj.map((item) => deepCloneForFirebase(item));
   }
   if (isPlainObject(obj)) {
      const cloned = {};
      for (const [key, value] of Object.entries(obj)) {
         if (typeof value !== 'function' && !(value instanceof Promise)) {
            cloned[key] = deepCloneForFirebase(value);
         }
      }
      return cloned;
   }
   return String(obj);
}

function deepMerge(target, source) {
   for (const key in source) {
      if (!source.hasOwnProperty(key)) continue;
      if (isPlainObject(source[key]) && key in target && isPlainObject(target[key])) {
         deepMerge(target[key], source[key]);
      } else if (source[key] !== undefined) {
         target[key] = deepCloneForFirebase(source[key]);
      }
   }
}

module.exports.isPlainObject = isPlainObject;
module.exports.deepCloneForFirebase = deepCloneForFirebase;
module.exports.deepMerge = deepMerge;
