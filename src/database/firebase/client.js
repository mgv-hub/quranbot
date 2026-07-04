let db = null;
let _isFirebaseReady = false;

Object.defineProperty(module.exports, 'db', {
    get: () => db,
    enumerable: true,
    configurable: true,
});
Object.defineProperty(module.exports, 'isFirebaseReady', {
    get: () => _isFirebaseReady,
    enumerable: true,
    configurable: true,
});

const admin = require('firebase-admin');
const logger = require('@logging/logger');

// firebase key sanitizer strips quotes/newlines that break dotenv parsing
function getSanitizedPrivateKey() {
    // Fix: Firebase private key format issue in Linux environments where newlines are escaped as \n
    const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    if (!rawKey) return '';
    let key = rawKey;
    key = key.replace(/\\n/g, '\n');
    key = key.replace(/\r\n/g, '\n');
    if (key.startsWith('"') && key.endsWith('"')) {
        key = key.slice(1, -1);
    }
    if (key && !key.endsWith('\n')) {
        key += '\n';
    }
    return key;
}

const firebaseAdminConfig = {
    type: process.env.FIREBASE_ADMIN_TYPE,
    project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
    private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    private_key: getSanitizedPrivateKey(),
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
    auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
    token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
};

let connectionAttempts = 0;
const max_connection_attempts = 5;

async function initializeFirebase() {
    if (_isFirebaseReady && db) {
        return true;
    }
    if (!firebaseAdminConfig.databaseURL || !firebaseAdminConfig.private_key) {
        logger.error('Firebase Database URL or Private Key is missing from environment variables');
        return false;
    }
    try {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(firebaseAdminConfig),
                databaseURL: firebaseAdminConfig.databaseURL,
            });
        }
        db = admin.database();
        _isFirebaseReady = true;
        logger.db('Firebase Admin Realtime Database Initialized Successfully');
        logger.db('Connected To ' + firebaseAdminConfig.databaseURL);
        return true;
    } catch (error) {
        connectionAttempts++;
        if (error.message.includes('Invalid PEM formatted message')) {
            logger.error('Firebase Private Key Format Invalid');
        } else {
            logger.error('Firebase initialization error', error);
        }
        if (connectionAttempts < max_connection_attempts) {
            await new Promise((resolve) => setTimeout(resolve, 2000 * connectionAttempts));
            return await initializeFirebase();
        }
        return false;
    }
}

// Only auto-initialize if not in test environment
if (process.env.NODE_ENV !== 'test' && process.env.SKIP_AUTO_INIT !== 'true') {
    initializeFirebase();
}

module.exports.firebaseAdminConfig = firebaseAdminConfig;
module.exports.initializeFirebase = initializeFirebase;
module.exports.max_connection_attempts = max_connection_attempts;
// Test helper to override readiness state
module.exports._setReadyForTest = (value) => {
    _isFirebaseReady = value;
};
