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
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0ATRy5vusodxO8YdipAJXzG0-IkO3m14",
  authDomain: "sokhapheap-digital.firebaseapp.com",
  projectId: "sokhapheap-digital",
  storageBucket: "sokhapheap-digital.firebasestorage.app",
  messagingSenderId: "987578360113",
  appId: "1:987578360113:web:f1a1803065d2c1bf191010"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Firebase Authentication
export const auth = getAuth(app);

// Cloud Firestore
export const db = getFirestore(app);

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type FirebaseUser
};


