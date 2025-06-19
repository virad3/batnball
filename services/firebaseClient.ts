
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// @ts-ignore window.firebaseConfig is defined in index.html
const firebaseConfigFromWindow = window.firebaseConfig;

let app: FirebaseApp;

if (getApps().length) {
  app = getApp();
} else {
  if (firebaseConfigFromWindow) {
    app = initializeApp(firebaseConfigFromWindow);
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

const authInstance: Auth = getAuth(app);
const dbInstance: Firestore = getFirestore(app);
const storageInstance: FirebaseStorage = getStorage(app);

export { app, authInstance as auth, dbInstance as db, storageInstance as storage };
