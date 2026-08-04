

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getDatabase, ref, get } from "firebase/database";
import * as fs from "fs";

const firebaseConfig = { 
  apiKey: "AIzaSyBa5Mj7EKCdgp_T2NDpwE3YXNkXAksOpr0",
  authDomain: "ecoschedule-demo.firebaseapp.com",
  projectId: "ecoschedule-demo",
  storageBucket: "ecoschedule-demo.firebasestorage.app",
  messagingSenderId: "579108475431",
  appId: "1:579108475431:web:7d96228e2b17d02bfab402",
  measurementId: "G-17XHBQKN7N"
};

const app = initializeApp(firebaseConfig);

// eslint-disable-next-line no-unused-vars
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
