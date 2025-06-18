
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

let app: FirebaseApp;

// Firebase app is expected to be initialized in index.html by the time this module is imported.
if (getApps().length > 0) {
  app = getApp(); // Get the default app initialized in index.html
} else {
  // Fallback: If no app is initialized (e.g., if this script runs before index.html's init,
  // or if index.html init fails), try to initialize it here using window.firebaseConfig.
  // This is a safety net but ideally should not be triggered if index.html is correct.
  // @ts-ignore
  const firebaseConfigFromWindow = window.firebaseConfig;
  if (firebaseConfigFromWindow) {
    console.warn("Firebase app not pre-initialized by index.html. Initializing in firebaseClient.ts using window.firebaseConfig.");
    app = initializeApp(firebaseConfigFromWindow);
  } else {
    const errorMessage = "CRITICAL: Firebase app is not initialized, and no firebaseConfig was found on window. Bat 'n' Ball cannot function.";
    console.error(errorMessage);
    // You might want to display this error to the user in a more user-friendly way
    // For now, throwing an error will halt script execution.
    const rootElement = document.getElementById('root');
    if (rootElement) {
        rootElement.innerHTML = `<div style="color: red; padding: 20px; text-align: center; font-family: sans-serif;">${errorMessage} Please check the setup.</div>`;
    }
    throw new Error(errorMessage);
  }
}

// Initialize services with the app instance.
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };