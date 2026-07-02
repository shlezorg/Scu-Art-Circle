import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyA4STS3Z29JKrZorkv_sGw_nvNnNYm4ars",
  authDomain: "art-circle-7e9ed.firebaseapp.com",
  projectId: "art-circle-7e9ed",
  storageBucket: "art-circle-7e9ed.firebasestorage.app",
  messagingSenderId: "956044048757",
  appId: "1:956044048757:web:8b403400ba43950e657b3c",
  measurementId: "G-D0PMQVBSMZ"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics conditionally (safeguards SSR or environments without window/document)
export const analytics = typeof window !== 'undefined' 
  ? isSupported().then(yes => yes ? getAnalytics(app) : null) 
  : Promise.resolve(null);

// Determine connection mode: Default to true (Local Simulator) to ensure out-of-the-box functionality,
// can be set to 'false' via localStorage to connect to Live Firebase.
export const useLocalMode = localStorage.getItem('scu_force_local_mode') !== 'false';

export default app;
