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
    if (process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost')) {
      // Log error more visibly during local development or if explicitly on localhost
      console.error(
        'Essential Firebase config keys (apiKey, authDomain, projectId) are missing. Firebase will not be initialized. Ensure NEXT_PUBLIC_FIREBASE_... variables are set in your .env.local file and the development server was restarted.'
      );
    } else if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PHASE !== 'phase-production-build') {
      // Log a less alarming message during other non-production builds if keys are missing
      // console.warn('Firebase config keys missing, Firebase services may not be available.');
    }
    // During production build (NEXT_PHASE === 'phase-production-build'), we might not want to log an error
    // if Firebase is intended to initialize only on the client.
    return false; 
  }

  if (getApps().length === 0) {
    try {
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
  if (!ensureFirebaseInitialized() || !app) {
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
  if (!ensureFirebaseInitialized() || !app) {
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
  if (!ensureFirebaseInitialized() || !app) {
    return null;
  }
  // Defer analytics initialization to when it's actually supported and needed,
  // and only on the client side.
  if (!analyticsInstance && typeof window !== 'undefined') {
    isAnalyticsSupported().then(supported => {
      if (supported && app) { // ensure app is not null
        try {
          analyticsInstance = getAnalytics(app);
        } catch (error) {
          // console.warn("Could not initialize Firebase Analytics:", error);
          analyticsInstance = null;
        }
      } else {
        // console.log("Firebase Analytics is not supported in this environment or app not initialized.");
      }
    }).catch(error => {
       // console.warn("Error checking Analytics support:", error);
    });
  }
  return analyticsInstance;
}
