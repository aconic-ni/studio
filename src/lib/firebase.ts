
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, type Analytics } from "firebase/analytics"; // Optional: if you need analytics

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase project configuration
// It's highly recommended to store these in environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional: if you use Analytics
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | undefined; // Optional

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

if (typeof window !== 'undefined') { // Optional: Initialize Analytics only on client side
  try {
    // Attempt to get analytics instance. If it's already initialized by this app instance, it will return it.
    // If another part of the app or another Firebase app instance on the page initialized it,
    // this might still work or might require ensuring it's the same app instance.
    // For simplicity, we'll try to initialize it if it hasn't been for this `app` instance.
    analytics = getAnalytics(app);
  } catch (error) {
    console.error("Error initializing Firebase Analytics", error);
    // It's possible Analytics is already initialized by another instance, or there's a config issue.
    // Depending on requirements, you might want to handle this more gracefully.
  }
}

export { app, auth, db, analytics };

