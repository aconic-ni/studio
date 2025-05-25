// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics"; // Analytics can be added if needed later

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
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
// const analytics = getAnalytics(app); // Analytics can be initialized if needed

export { app, auth };
