import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs } from 'firebase/firestore';

const oldConfig = {
  projectId: "gen-lang-client-0447500373",
  appId: "1:76674217526:web:9ed335500393bfbdacca97",
  apiKey: "AIzaSyCFvxkQOxpuG_Rrn3clWz27YU9dyu3uYDc",
  authDomain: "gen-lang-client-0447500373.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-8fdcd080-33e9-4f3a-8594-804bcad371b2",
  storageBucket: "gen-lang-client-0447500373.firebasestorage.app",
  messagingSenderId: "76674217526"
};

async function checkOldData() {
  const oldApp = initializeApp(oldConfig, 'old-app');
  const oldDb = initializeFirestore(oldApp, { experimentalForceLongPolling: true }, oldConfig.firestoreDatabaseId);

  const collections = ['courses', 'learningPaths', 'users', 'notifications', 'banners', 'publicProfiles', 'reports'];
  console.log("Checking collections in old Firestore database...");
  for (const col of collections) {
    try {
      const snap = await getDocs(collection(oldDb, col));
      console.log(`- Collection '${col}': ${snap.size} documents`);
    } catch (err: any) {
      console.log(`- Collection '${col}': Error reading (${err.message})`);
    }
  }
}

checkOldData().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
