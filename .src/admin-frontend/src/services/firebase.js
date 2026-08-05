import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = { 
  apiKey: "AIzaSyAIN5FqIktCoBt47eufcA0miv1-YqInOD0",
  authDomain: "swp302-db.firebaseapp.com",
  projectId: "swp302-db",
  storageBucket: "swp302-db.firebasestorage.app",
  messagingSenderId: "77909565820",
  appId: "1:77909565820:web:4cb48bab494e1919e344f9"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Firestore Database
export const db = getFirestore(app);

// Khởi tạo Firebase Authentication
export const auth = getAuth(app);

export default app;
