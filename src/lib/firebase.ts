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

function initializeFirebase() {
  if (app) return; // Already initialized or attempted

  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.authDomain ||
    !firebaseConfig.projectId
  ) {
    console.error(
      'Firebase config keys (apiKey, authDomain, projectId) are missing. Firebase will not be initialized. Ensure they are set in your environment variables (e.g., .env.local).'
    );
    // Crucially, do not proceed to initializeApp if config is missing
    return; 
  }

  if (getApps().length === 0) {
    try {
      app = initializeApp(firebaseConfig);
      console.log("Firebase App initialized successfully.");
    } catch (error) {
      console.error("Error initializing Firebase App:", error);
      app = null; // Ensure app is null if initialization fails
    }
  } else {
    app = getApps()[0];
    // console.log("Firebase App already initialized (retrieved existing instance).");
  }
}

// Call initialization at module load. It will guard itself against multiple calls 
// and missing configuration.
initializeFirebase();


export function getFirebaseApp(): FirebaseApp | null {
  // If app is still null here, it means initialization failed (e.g. due to missing config)
  // or initializeFirebase() hasn't run for some reason (unlikely with module-level call).
  return app;
}

export function getFirebaseAuth(): Auth | null {
  if (!app) {
    // console.warn("Firebase App not initialized. Cannot get Auth instance.");
    return null;
  }
  if (!authInstance) {
    try {
      authInstance = getAuth(app);
    } catch (error) {
      // This can happen during SSR/prerender if auth relies on browser APIs or if app init failed.
      // console.warn("Could not initialize Firebase Auth, possibly due to non-browser environment or app init failure:", error);
      authInstance = null;
    }
  }
  return authInstance;
}

export function getFirebaseFirestore(): Firestore | null {
  if (!app) {
    // console.warn("Firebase App not initialized. Cannot get Firestore instance.");
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
  if (!app) {
    // console.warn("Firebase App not initialized. Cannot get Analytics instance.");
    return null;
  }
  if (!analyticsInstance && typeof window !== 'undefined') {
    // Defer analytics initialization to when it's actually supported and needed.
    isAnalyticsSupported().then(supported => {
      if (supported) {
        try {
          analyticsInstance = getAnalytics(app);
        } catch (error) {
          // console.warn("Could not initialize Firebase Analytics:", error);
          analyticsInstance = null;
        }
      } else {
        // console.log("Firebase Analytics is not supported in this environment.");
      }
    }).catch(error => {
       // console.warn("Error checking Analytics support:", error);
    });
  }
  return analyticsInstance;
}
