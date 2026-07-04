function isPlainObject(obj) {
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj) && Object.getPrototypeOf(obj) === Object.prototype;
}

// Cycle-aware clone to prevent stack overflow during state persistence
function deepCloneForFirebase(obj, seen = new WeakSet()) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (seen.has(obj)) return undefined;
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

// Cycle-aware merge to prevent infinite recursion during state updates
function deepMerge(target, source, seen = new WeakSet()) {
    if (seen.has(target) || seen.has(source)) return;
    seen.add(target);
    seen.add(source);

    for (const key in source) {
        if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
        const srcVal = source[key];
        if (srcVal === undefined) continue;
        if (isPlainObject(srcVal) && key in target && isPlainObject(target[key])) {
            deepMerge(target[key], srcVal, seen);
        } else if (typeof srcVal !== 'function' && !(srcVal instanceof Promise)) {
            target[key] = deepCloneForFirebase(srcVal, seen);
        }
    }
}

module.exports.isPlainObject = isPlainObject;
module.exports.deepCloneForFirebase = deepCloneForFirebase;
module.exports.deepMerge = deepMerge;
