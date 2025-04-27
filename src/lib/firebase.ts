// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBKroZeEfTpoppVhFG9DJQd4coRWRnie5Y",
  authDomain: "skill-trade-4024d.firebaseapp.com",
  projectId: "skill-trade-4024d",
  storageBucket: "skill-trade-4024d.appspot.com",
  messagingSenderId: "27427753887",
  appId: "1:27427753887:web:07b50e875523f9926677aa",
  measurementId: "G-TFFF3B6MXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);