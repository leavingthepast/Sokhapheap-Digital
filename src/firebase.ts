import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  User
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0ATRy5vusodxO8YdipAJXzG0-IkO3m14",
  authDomain: "sokhapheap-digital.firebaseapp.com",
  projectId: "sokhapheap-digital",
  storageBucket: "sokhapheap-digital.firebasestorage.app",
  messagingSenderId: "987578360113",
  appId: "1:987578360113:web:b503e216a965037d191010"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification
};
export type { User };

