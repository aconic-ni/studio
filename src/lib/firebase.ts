
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, type Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBcGYgGUGwj85OljFBnOXZodXty_A7lYxw",
  authDomain: "customs-ex-p.firebaseapp.com",
  projectId: "customs-ex-p",
  storageBucket: "customs-ex-p.firebasestorage.app", // Using the bucket name you provided
  messagingSenderId: "826985934088",
  appId: "1:826985934088:web:ac258c65c60ed0e99d90bd"
  // measurementId is optional and was not in your latest snippet, so it's omitted here.
  // If you have one and need it, it can be added back.
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
