import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const newConfig = {
  apiKey: "AIzaSyAcVzXMmtcixXTn2sOGehfbo6s0NBQevYo",
  authDomain: "skilliq-1337.firebaseapp.com",
  projectId: "skilliq-1337",
  storageBucket: "skilliq-1337.firebasestorage.app",
  messagingSenderId: "336826489731",
  appId: "1:336826489731:web:6fcfb5013b6e0898d774b6"
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
