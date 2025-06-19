
import firebase from 'firebase/compat/app'; // Firebase v8 style default import with compat
import 'firebase/compat/auth';             // Side-effect import for auth with compat
import 'firebase/compat/firestore';        // Side-effect import for firestore with compat
import 'firebase/compat/storage';          // Side-effect import for storage with compat

// Type for the Firebase app instance in v8 (compat layer mimics this)
type FirebaseAppV8 = firebase.app.App;

// Types for Firebase services in v8 (compat layer mimics this)
type AuthV8 = firebase.auth.Auth;
type FirestoreV8 = firebase.firestore.Firestore;
type FirebaseStorageV8 = firebase.storage.Storage;

let app: FirebaseAppV8;

// @ts-ignore window.firebaseConfig is defined in index.html
const firebaseConfigFromWindow = window.firebaseConfig;

if (firebase.apps.length > 0) { // v8 style: check existing apps
  app = firebase.app(); // v8 style: get default app
} else {
  // Fallback: If no app is initialized, try to initialize it here using window.firebaseConfig.
  if (firebaseConfigFromWindow) {
    console.warn("Firebase app not pre-initialized by index.html. Initializing in firebaseClient.ts using window.firebaseConfig (v8 compat style).");
    app = firebase.initializeApp(firebaseConfigFromWindow); // v8 style: initializeApp
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

// Initialize services using v8 style (works with compat)
const authInstance: AuthV8 = firebase.auth(app);
const dbInstance: FirestoreV8 = firebase.firestore(app);
const storageInstance: FirebaseStorageV8 = firebase.storage(app);

export { app, authInstance as auth, dbInstance as db, storageInstance as storage };
