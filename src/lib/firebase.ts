
// Import the functions you need from the SDKs you need
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, type Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCQC1mhHsl8_jd-z7gwSud4918rdAF-OU0",
  authDomain: "customsex-p.firebaseapp.com",
  projectId: "customsex-p",
  storageBucket: "customsex-p.firebasestorage.app", // Using the bucket name you provided
  messagingSenderId: "1037782875421",
  appId: "1:1037782875421:web:81d185a49efa176106f5f4",
  measurementId: "G-JH6903HB5S"
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let analytics: Analytics | undefined; // Analytics can be undefined if not in browser

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  // Only initialize analytics if in a browser environment
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
  console.log("Firebase initialized successfully with the provided configuration in src/lib/firebase.ts.");
} catch (error) {
  console.error("CRITICAL ERROR initializing Firebase in src/lib/firebase.ts:", error);
  console.error(
    "Firebase could not be initialized. This usually means the firebaseConfig object is malformed or missing essential properties. " +
    "Database-dependent features will NOT work. Please check your Firebase setup."
  );
  // Ensure db is null if initialization fails, so the app's firebaseConfigured check works.
  db = null as unknown as Firestore; // Type assertion to satisfy Firestore type when it's null
}

export { db, analytics };
