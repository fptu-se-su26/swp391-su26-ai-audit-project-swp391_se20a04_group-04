import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = { 
  apiKey: "AIzaSyCiOTRRFG-jw3fgeT2xrW-XAIwnqOY7gt0",
  authDomain: "swp391-database.firebaseapp.com",
  projectId: "swp391-database",
  storageBucket: "swp391-database.firebasestorage.app",
  messagingSenderId: "55209791344",
  appId: "1:55209791344:web:dcee1ca5904fffda7a89b5",
  measurementId: "G-17XHBQKN7N"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Firestore Database
export const db = getFirestore(app);

// Khởi tạo Firebase Authentication
export const auth = getAuth(app);

export default app;
