import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = { 
  apiKey: "AIzaSyBa5Mj7EKCdgp_T2NDpwE3YXNkXAksOpr0",
  authDomain: "ecoschedule-demo.firebaseapp.com",
  projectId: "ecoschedule-demo",
  storageBucket: "ecoschedule-demo.firebasestorage.app",
  messagingSenderId: "579108475431",
  appId: "1:579108475431:web:7d96228e2b17d02bfab402",
  measurementId: "G-17XHBQKN7N"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Firestore Database
export const db = getFirestore(app);

// Khởi tạo Firebase Authentication
export const auth = getAuth(app);

export default app;
