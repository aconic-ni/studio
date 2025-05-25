// Import the functions you need from the SDKs you need
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getAnalytics, type Analytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA2UWt9LUyRQla21ORN3y-Oyu4ab4cWWs0",
  authDomain: "customsfa-l.firebaseapp.com",
  projectId: "customsfa-l",
  storageBucket: "customsfa-l.firebasestorage.app",
  messagingSenderId: "683654250445",
  appId: "1:683654250445:web:1a5bfa3deaecc92dd60e84",
  measurementId: "G-D8R5MWBPVD"
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let analytics: Analytics | undefined = undefined; // Optional

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  if (typeof window !== 'undefined') {
    // Initialize Analytics only on the client side
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  // Fallback or error handling if Firebase initialization fails
  // For example, you might want to throw the error or set app/auth to null
  // to prevent further Firebase-dependent operations.
  // For now, we'll let it throw if critical, or you can handle it.
  // For a Next.js app, ensure this doesn't break server-side rendering if not handled carefully.
  // The check `typeof window !== 'undefined'` for analytics helps.
}

export { app, auth, analytics };
