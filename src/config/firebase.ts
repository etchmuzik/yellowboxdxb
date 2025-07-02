import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

// Firebase configuration using environment variables with fallback values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAy7LWZ6Ni0x2RiveXFEHaa6R0GYT63wVs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "yellowbox-8e0e6.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "yellowbox-8e0e6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "yellowbox-8e0e6.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "47222199157",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:47222199157:web:c5d8e374f6a6054dd7b408"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app);
const storage = getStorage(app);

// Set authentication persistence to local (keeps user logged in until they explicitly sign out)
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

export { app, db, auth, functions, storage };
