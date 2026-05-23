import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getDatabase, ref, get } from "firebase/database";
import fs from "fs";

const firebaseConfig = { 
  apiKey : "AIzaSyAg8Q-X9YO3TdUeLRwTs9H_hxbK55MXugw" , 
  authDomain : "swp391-database.firebaseapp.com" , 
  projectId : "swp391-database" , 
  storageBucket : "swp391-database.firebasestorage.app" , 
  messagingSenderId : "55209791344" , 
  appId : "1:55209791344:web:dcee1ca5904fffda7a89b5" , 
  measurementId : "G-17XHBQKN7N" 
};

const app = initializeApp(firebaseConfig);

async function checkRealtimeDB() {
    console.log("Checking Realtime Database...");
    try {
        const db = getDatabase(app);
        const snapshot = await get(ref(db, '/'));
        if (snapshot.exists()) {
            console.log("Realtime Database data found.");
            fs.writeFileSync('../../Data/realtime_db.json', JSON.stringify(snapshot.val(), null, 2));
            return true;
        } else {
            console.log("Realtime DB is empty.");
        }
    } catch (e) {
        console.log("Error reading Realtime DB:", e.message);
    }
    return false;
}

async function checkFirestore() {
    console.log("Checking Firestore...");
    const db = getFirestore(app);
    const commonCollections = [
        'users', 'schedules', 'reports', 'notifications', 
        'payments', 'garbage', 'residents', 'staff', 'admins', 
        'roles', 'feedback', 'locations'
    ];
    let foundAny = false;
    
    for (const col of commonCollections) {
        try {
            const querySnapshot = await getDocs(collection(db, col));
            if (!querySnapshot.empty) {
                const data = [];
                querySnapshot.forEach((doc) => {
                    data.push({ id: doc.id, ...doc.data() });
                });
                console.log(`Found ${data.length} docs in collection: ${col}`);
                fs.writeFileSync(`../../Data/${col}.json`, JSON.stringify(data, null, 2));
                foundAny = true;
            }
        } catch (e) {
            console.log(`Error reading collection ${col}:`, e.message);
        }
    }
    if (!foundAny) {
        console.log("No data found in common Firestore collections.");
    }
}

async function main() {
    await checkFirestore();
    console.log("Done.");
    process.exit(0);
}

main();
