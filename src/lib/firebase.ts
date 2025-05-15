
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

// IMPORTANT: This is a placeholder configuration.
// You MUST replace these values with your actual Firebase project configuration for it to work.
// See the Firebase documentation for how to initialize Firebase:
// https://firebase.google.com/docs/web/setup
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
// This line initializes Firebase. If the firebaseConfig above still contains "YOUR_..." placeholders,
// Firebase might initialize structurally but will not connect to your actual project.
// The application's UI will show warnings if Firebase is not properly connected or if database operations fail.
let app: FirebaseApp;
let db: Firestore;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  // A more specific warning for the console when this file is loaded:
  if (firebaseConfig.apiKey === "YOUR_API_KEY" || firebaseConfig.projectId === "YOUR_PROJECT_ID") {
    console.warn(
      "Firebase has been initialized in src/lib/firebase.ts using PLACEHOLDER credentials. " +
      "Please update 'firebaseConfig' in src/lib/firebase.ts with your actual Firebase project settings " +
      "for database features to work correctly. The application UI will indicate if database operations are failing."
    );
  } else {
    console.log("Firebase initialized using the configuration in src/lib/firebase.ts.");
  }
} catch (error) {
  console.error("CRITICAL ERROR initializing Firebase in src/lib/firebase.ts:", error);
  console.error(
    "Firebase could not be initialized. This usually means the firebaseConfig object is malformed or missing essential properties. " +
    "Database-dependent features will NOT work. Please check your Firebase setup."
  );
  // Ensure db is null if initialization fails, so the app's firebaseConfigured check works.
  db = null as unknown as Firestore;
}

export { db };
