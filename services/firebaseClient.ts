

import { initializeApp, FirebaseApp } from 'firebase/app'; // Removed getApp, getApps as this is now the sole initializer
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Define the expected structure of the Firebase config object
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  // Add other properties if your config includes them, e.g., measurementId
}

// @ts-ignore window.firebaseConfig is defined in index.html
const firebaseConfigFromWindow = window.firebaseConfig as FirebaseConfig | undefined;

let app: FirebaseApp;

if (
  !firebaseConfigFromWindow ||
  !firebaseConfigFromWindow.apiKey ||
  !firebaseConfigFromWindow.authDomain ||
  !firebaseConfigFromWindow.projectId ||
  !firebaseConfigFromWindow.storageBucket ||
  !firebaseConfigFromWindow.messagingSenderId ||
  !firebaseConfigFromWindow.appId
) {
  const errorMessage = "CRITICAL: Firebase configuration is missing or invalid on window.firebaseConfig. Bat 'n' Ball cannot function. Please ensure your Firebase project credentials are correctly set in index.html.";
  console.error(errorMessage, "Config found:", firebaseConfigFromWindow);
  const rootElement = document.getElementById('root');
  if (rootElement) {
      rootElement.innerHTML = `<div style="color: red; padding: 20px; text-align: center; font-family: sans-serif; background-color: #fff;">${errorMessage} Please check the setup in index.html.</div>`;
  }
  throw new Error(errorMessage);
}

// Initialize Firebase here, ONCE.
try {
  app = initializeApp(firebaseConfigFromWindow);
} catch (e) {
  console.error("CRITICAL: Firebase initialization failed. This might be due to an invalid configuration.", e);
  const rootElement = document.getElementById('root');
  if (rootElement) {
      rootElement.innerHTML = `<div style="color: red; padding: 20px; text-align: center; font-family: sans-serif; background-color: #fff;">CRITICAL: Firebase initialization failed. Check console and Firebase config.</div>`;
  }
  throw e; // Re-throw to stop execution
}


const authInstance: Auth = getAuth(app);
const dbInstance: Firestore = getFirestore(app);
const storageInstance: FirebaseStorage = getStorage(app);

export { app, authInstance as auth, dbInstance as db, storageInstance as storage };