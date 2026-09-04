// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";
import { 
  initializeFirestore, 
  getFirestore, 
  memoryLocalCache, 
  Firestore 
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0ATRy5vusodxO8YdipAJXzG0-IkO3m14",
  authDomain: "sokhapheap-digital.firebaseapp.com",
  projectId: "sokhapheap-digital",
  storageBucket: "sokhapheap-digital.firebasestorage.app",
  messagingSenderId: "987578360113",
  appId: "1:987578360113:web:f1a1803065d2c1bf191010"
};

// Purge any legacy poisoned offline write queues stored in browser IndexedDB
if (typeof window !== 'undefined' && window.indexedDB && typeof window.indexedDB.databases === 'function') {
  try {
    window.indexedDB.databases().then((dbs) => {
      for (const dbInfo of dbs) {
        if (dbInfo.name && (dbInfo.name.startsWith('firestore') || dbInfo.name.includes('firestore'))) {
          try {
            window.indexedDB.deleteDatabase(dbInfo.name);
            console.info(`[Firestore] Purged legacy persistent write cache: ${dbInfo.name}`);
          } catch {
            // ignore
          }
        }
      }
    }).catch(() => {});
  } catch {
    // ignore
  }
}

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Firebase Authentication
export const auth = getAuth(app);

// Cloud Firestore with in-memory caching to prevent WriteStream queue exhaustion
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: memoryLocalCache(),
  });
} catch {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type FirebaseUser
};


