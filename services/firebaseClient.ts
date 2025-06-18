
import * as firebaseAppNs from 'firebase/app'; // Changed from named import
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

let app: firebaseAppNs.FirebaseApp; // Use type from namespace

// @ts-ignore window.firebaseConfig is defined in index.html
const firebaseConfigFromWindow = window.firebaseConfig;

if (firebaseAppNs.getApps().length > 0) { // Check if any Firebase app is already initialized
  app = firebaseAppNs.getApp(); // Get the default initialized app
} else {
  // Fallback: If no app is initialized (e.g., if this script runs before index.html's init,
  // or if index.html init fails), try to initialize it here using window.firebaseConfig.
  if (firebaseConfigFromWindow) {
    console.warn("Firebase app not pre-initialized by index.html. Initializing in firebaseClient.ts using window.firebaseConfig.");
    app = firebaseAppNs.initializeApp(firebaseConfigFromWindow);
  } else {
    const errorMessage = "CRITICAL: Firebase app is not initialized, and no firebaseConfig was found on window. Bat 'n' Ball cannot function.";
    console.error(errorMessage);
    const rootElement = document.getElementById('root');
    if (rootElement) {
        rootElement.innerHTML = `<div style="color: red; padding: 20px; text-align: center; font-family: sans-serif;">${errorMessage} Please check the setup.</div>`;
    }
    throw new Error(errorMessage);
  }
}

// Initialize services with the app instance.
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };