import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// IMPORTANT: You need to add your Firebase service account credentials

// Option 1: Using service account JSON file (RECOMMENDED - Easiest)
// 1. Download the JSON file from Firebase Console → Project Settings → Service Accounts → Generate new private key
// 2. Save it as 'serviceAccountKey.json' in this directory (backend/src/config/)
// 3. Uncomment the lines below

import * as serviceAccount from './serviceAccountKey.json';
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

console.log('✅ Firebase Admin SDK initialized successfully with service account JSON');

export const firebaseAdmin = admin;
export const auth = admin.auth();
export const isFirebaseConfigured = true;
