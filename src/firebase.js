
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { ref, getDownloadURL } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAElOrOjdJGZKcN92sbERv0GQlyi9U8p14",
  authDomain: "ed3c-58e92.firebaseapp.com",
  projectId: "ed3c-58e92",
  storageBucket: "ed3c-58e92.appspot.com",
  messagingSenderId: "107147005820",
  appId: "1:107147005820:web:aedf661ae61673b3335ef9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const firestore = getFirestore(app);

// Initialize Google Auth provider
const googleProvider = new GoogleAuthProvider();

// Export Firebase services and Google provider
export { auth, googleProvider, firestore, db };
export const storage = getStorage(app);

