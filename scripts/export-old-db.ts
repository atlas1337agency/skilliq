import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const oldConfig = {
  projectId: "gen-lang-client-0447500373",
  appId: "1:76674217526:web:9ed335500393bfbdacca97",
  apiKey: "AIzaSyCFvxkQOxpuG_Rrn3clWz27YU9dyu3uYDc",
  authDomain: "gen-lang-client-0447500373.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-8fdcd080-33e9-4f3a-8594-804bcad371b2",
  storageBucket: "gen-lang-client-0447500373.firebasestorage.app",
  messagingSenderId: "76674217526"
};

async function exportOldData() {
  const oldApp = initializeApp(oldConfig, 'old-app-export');
  const oldDb = initializeFirestore(oldApp, { experimentalForceLongPolling: true }, oldConfig.firestoreDatabaseId);

  const backupData: Record<string, any[]> = {};
  const collections = ['courses', 'learningPaths', 'notifications', 'banners', 'publicProfiles'];

  for (const col of collections) {
    try {
      const snap = await getDocs(collection(oldDb, col));
      const items: any[] = [];
      snap.forEach(d => {
        items.push({ id: d.id, ...d.data() });
      });
      backupData[col] = items;
      console.log(`Exported ${items.length} records from '${col}'`);
    } catch (err: any) {
      console.warn(`Could not read '${col}': ${err.message}`);
    }
  }

  const exportPath = path.resolve('firestore-export-old.json');
  fs.writeFileSync(exportPath, JSON.stringify(backupData, null, 2));
  console.log(`Saved backup to ${exportPath}`);
}

exportOldData().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
