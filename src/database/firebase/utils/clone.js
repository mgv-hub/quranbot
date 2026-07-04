function isPlainObject(obj) {
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj) && Object.getPrototypeOf(obj) === Object.prototype;
}

// Added WeakSet cycle detection to prevent Maximum call stack size exceeded
function deepCloneForFirebase(obj, seen = new WeakSet()) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (seen.has(obj)) return undefined; // Break circular reference safely
    seen.add(obj);

    if (Array.isArray(obj)) {
        return obj.map((item) => deepCloneForFirebase(item, seen));
    }

    if (isPlainObject(obj)) {
        const cloned = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'function' || value instanceof Promise) continue;
            cloned[key] = deepCloneForFirebase(value, seen);
        }
        return cloned;
    }

    return String(obj);
}

module.exports.isPlainObject = isPlainObject;
module.exports.deepCloneForFirebase = deepCloneForFirebase;
