
import firebase from 'firebase/compat/app'; // Import compat app module
// Modular imports for services are kept
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

let app; // This will be firebase.app.App from compat

// Firebase app is expected to be initialized in index.html
if (firebase.getApps().length > 0) { // Use compat API: firebase.getApps()
  app = firebase.getApp(); // Use compat API: firebase.getApp()
} else {
  // Fallback: If no app is initialized (e.g., if this script runs before index.html's init,
  // or if index.html init fails), try to initialize it here using window.firebaseConfig.
  // This is a safety net but ideally should not be triggered.
  // @ts-ignore
  const firebaseConfigFromWindow = window.firebaseConfig;
  if (firebaseConfigFromWindow) {
    console.warn("Firebase app not pre-initialized. Initializing in firebaseClient.ts using window.firebaseConfig. Ensure index.html initializes Firebase.");
    // @ts-ignore
    app = firebase.initializeApp(firebaseConfigFromWindow); // Use compat API: firebase.initializeApp()
  } else {
    const errorMessage = "CRITICAL: Firebase app is not initialized, and no firebaseConfig was found on window. Cannot proceed.";
    console.error(errorMessage);
    throw new Error(errorMessage); // Critical failure, app cannot function
  }
}

// Initialize services with the app instance.
// These modular SDK calls (getAuth, getFirestore, getStorage)
// should generally be compatible with an App instance obtained from the compat layer.
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
