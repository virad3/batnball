
import firebase from 'firebase/app'; // Changed to default import
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration should be done in index.html for this setup
// This file will get the initialized app instance.

let app;
if (!firebase.getApps().length) { // Used firebase.getApps()
    // This case should ideally not be hit if index.html initializes correctly
    // However, as a fallback or for environments where index.html script might not run first
    // (though unlikely for this project structure), we attempt initialization.
    // Prefer initialization in index.html to ensure config is loaded.
    console.warn("Firebase app not initialized. Attempting fallback initialization. Ensure firebaseConfig is globally available or defined in index.html.");
    // @ts-ignore
    if (window.firebaseConfig) {
        // @ts-ignore
        app = firebase.initializeApp(window.firebaseConfig); // Used firebase.initializeApp()
    } else {
        throw new Error("Firebase configuration is missing. Initialize Firebase in index.html or ensure window.firebaseConfig is set.");
    }
} else {
    app = firebase.getApp(); // Used firebase.getApp()
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
