import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const newConfig = {
  apiKey: "AIzaSyAcVzXMmtcixXTn2sOGehfbo6s0NBQevYo",
  authDomain: "skilliq-1337.firebaseapp.com",
  projectId: "skilliq-1337",
  storageBucket: "skilliq-1337.firebasestorage.app",
  messagingSenderId: "336826489731",
  appId: "1:336826489731:web:6fcfb5013b6e0898d774b6"
};

async function testWrite() {
  console.log("Testing connection to skilliq-1337...");
  const newApp = initializeApp(newConfig, 'test-write-app');
  const newDb = initializeFirestore(newApp, { experimentalForceLongPolling: true });

  const testRef = doc(newDb, 'system_test', 'ping');
  try {
    const promise = setDoc(testRef, { test: true, timestamp: Date.now() });
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout after 6s")), 6000));
    await Promise.race([promise, timeout]);
    console.log("Write succeeded to skilliq-1337!");
  } catch (err: any) {
    console.log("Write failed/timed out:", err.message);
  }
}

testWrite().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
