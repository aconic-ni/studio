// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, type Analytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let analyticsInstance: Analytics | null = null;

function ensureFirebaseInitialized(): boolean {
  if (app) return true; // Already initialized

  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.authDomain ||
    !firebaseConfig.projectId
  ) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

    const message = `Essential Firebase config keys (apiKey, authDomain, projectId) are missing. Firebase will not be initialized. API Key: ${firebaseConfig.apiKey ? 'Exists' : 'MISSING'}, Auth Domain: ${firebaseConfig.authDomain ? 'Exists' : 'MISSING'}, Project ID: ${firebaseConfig.projectId ? 'Exists' : 'MISSING'}. Ensure NEXT_PUBLIC_FIREBASE_... variables are set.`;

    if (isDevelopment || isLocalhost) {
      console.error(`[Firebase Init Check - DEV] ${message}`);
    } else if (!isBuildPhase) {
      // console.warn(`[Firebase Init Check - NON-PROD-BUILD] ${message}`);
    } else {
      // During production build, log this for debugging build issues specifically
      // console.log(`[Firebase Init Check - PROD-BUILD] ${message}`);
    }
    return false; 
  }

  if (getApps().length === 0) {
    try {
      // console.log('[Firebase Build Check] Attempting to initialize Firebase with config during build/runtime:', JSON.stringify({apiKey: firebaseConfig.apiKey ? '***' : 'MISSING', authDomain: firebaseConfig.authDomain, projectId: firebaseConfig.projectId}));
      app = initializeApp(firebaseConfig);
      // console.log("Firebase App initialized successfully.");
    } catch (error) {
      // console.error("Error initializing Firebase App:", error);
      app = null; 
    }
  } else {
    app = getApps()[0];
    // console.log("Firebase App already initialized (retrieved existing instance).");
  }
  return app !== null;
}

export function getFirebaseApp(): FirebaseApp | null {
  if (ensureFirebaseInitialized()) {
    return app;
  }
  return null;
}

export function getFirebaseAuth(): Auth | null {
  if (!ensureFirebaseInitialized() || !app) { // Check app explicitly here
    return null;
  }
  if (!authInstance) {
    try {
      authInstance = getAuth(app);
    } catch (error) {
      // console.warn("Could not initialize Firebase Auth:", error);
      authInstance = null;
    }
  }
  return authInstance;
}

export function getFirebaseFirestore(): Firestore | null {
  if (!ensureFirebaseInitialized() || !app) { // Check app explicitly here
    return null;
  }
  if (!dbInstance) {
    try {
      dbInstance = getFirestore(app);
    } catch (error) {
      // console.warn("Could not initialize Firebase Firestore:", error);
      dbInstance = null;
    }
  }
  return dbInstance;
}

export function getFirebaseAnalytics(): Analytics | null {
  if (!ensureFirebaseInitialized() || !app) { // Check app explicitly here
    return null;
  }
  if (!analyticsInstance && typeof window !== 'undefined') {
    isAnalyticsSupported().then(supported => {
      if (supported && app) {
        try {
          analyticsInstance = getAnalytics(app);
        } catch (error) {
          // console.warn("Could not initialize Firebase Analytics:", error);
          analyticsInstance = null;
        }
      }
    }).catch(error => {
       // console.warn("Error checking Analytics support for Firebase:", error);
    });
  }
  return analyticsInstance;
}
