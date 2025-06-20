
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

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
let app: firebase.app.App;
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfigFromWindow);
} else {
  app = firebase.app(); // if already initialized
}

const authInstance = firebase.auth();
const dbInstance = firebase.firestore();
const storageInstance = firebase.storage();

const Timestamp = firebase.firestore.Timestamp;
const FieldValue = firebase.firestore.FieldValue;

export { app, authInstance as auth, dbInstance as db, storageInstance as storage, Timestamp, FieldValue, firebase };
export type FirebaseTimestamp = firebase.firestore.Timestamp;
export type FirebaseDocumentData = firebase.firestore.DocumentData;
export type FirebaseQuery = firebase.firestore.Query;
export type FirebaseCollectionReference = firebase.firestore.CollectionReference;
export type FirebaseDocumentReference = firebase.firestore.DocumentReference;
export type FirebaseQuerySnapshot = firebase.firestore.QuerySnapshot;
export type FirebaseDocumentSnapshot = firebase.firestore.DocumentSnapshot;
