import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const newConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || "",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "skilliq-1337.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "skilliq-1337",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "skilliq-1337.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "336826489731",
  appId: process.env.FIREBASE_APP_ID || "1:336826489731:web:6fcfb5013b6e0898d774b6"
};

async function importToNewData() {
  const exportPath = path.resolve('firestore-export-old.json');
  if (!fs.existsSync(exportPath)) {
    console.error(`Export file not found at ${exportPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(exportPath, 'utf-8');
  const data = JSON.parse(raw);

  const newApp = initializeApp(newConfig, 'new-app-import');
  const newDb = initializeFirestore(newApp, { experimentalForceLongPolling: true });

  for (const [colName, docs] of Object.entries<any[]>(data)) {
    console.log(`Importing ${docs.length} documents into collection '${colName}'...`);
    let count = 0;
    for (const item of docs) {
      const { id, ...docData } = item;
      const docId = id || docData.id;
      if (!docId) continue;
      try {
        await setDoc(doc(newDb, colName, docId), docData);
        count++;
      } catch (err: any) {
        console.error(`Error writing doc ${docId} in '${colName}':`, err.message);
      }
    }
    console.log(`Successfully wrote ${count}/${docs.length} docs to '${colName}'`);
  }
}

importToNewData().then(() => {
  console.log("Migration finished.");
  process.exit(0);
}).catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
