import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseReady = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

let app = null;
let auth = null;
let db = null;

if (firebaseReady) {
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };
export const googleProvider = firebaseReady ? new GoogleAuthProvider() : null;
export { signInWithPopup, signOut, onAuthStateChanged, collection, addDoc, setDoc, doc, deleteDoc, query, where, onSnapshot, serverTimestamp, getDocs };
