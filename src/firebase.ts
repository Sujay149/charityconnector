import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAPYA_96bsldsndvZ493MFZDRFqU4n4_kM",
  authDomain: "charitysignup.firebaseapp.com",
  projectId: "charitysignup",
  storageBucket: "charitysignup.firebasestorage.app",
  messagingSenderId: "403326978268",
  appId: "1:403326978268:web:21ced734302e9c81958c19",
  measurementId: "G-PEP4ZC9XV9",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
