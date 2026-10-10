import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs } from 'firebase/firestore';

const oldConfig = {
  projectId: process.env.OLD_FIREBASE_PROJECT_ID || "gen-lang-client-0447500373",
  appId: process.env.OLD_FIREBASE_APP_ID || "1:76674217526:web:9ed335500393bfbdacca97",
  apiKey: process.env.OLD_FIREBASE_API_KEY || "",
  authDomain: process.env.OLD_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0447500373.firebaseapp.com",
  firestoreDatabaseId: process.env.OLD_FIREBASE_DATABASE_ID || "ai-studio-8fdcd080-33e9-4f3a-8594-804bcad371b2",
  storageBucket: process.env.OLD_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0447500373.firebasestorage.app",
  messagingSenderId: process.env.OLD_FIREBASE_MESSAGING_SENDER_ID || "76674217526"
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
