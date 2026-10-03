import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, collectionGroup, addDoc, setDoc, updateDoc, doc, deleteDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';

// Firebase web configuration is public. Data access is enforced by firestore.rules.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAAuzuyRW6PARALwIBsYXA7z3pWdPPAUnM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'calendar-f3d1b.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'calendar-f3d1b',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'calendar-f3d1b.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '894299121899',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:894299121899:web:83689abd58d4d4489576ae',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-1LCX8RL1J8',
};

export const app = getApps().length ? getApp() : initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export const analyticsReady = typeof window !== 'undefined'
  ? isSupported().then(supported => supported ? getAnalytics(app) : null).catch(() => null)
  : Promise.resolve(null);

export { firebaseError } from './firebaseMessages';
export { signInWithPopup, signOut, onAuthStateChanged, collection, collectionGroup, addDoc, setDoc, updateDoc, doc, deleteDoc, query, where, onSnapshot, serverTimestamp };
