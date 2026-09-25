import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const config = JSON.parse(fs.readFileSync(path.resolve('./firebase-applet-config.json'), 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    const d = doc(db, 'notifications', 'test-id');
    const notif = {
        id: "test-id",
        title: "Test",
        message: "Test message",
        isActive: true,
        createdAt: Date.now()
    };
    await setDoc(d, notif);
    console.log('Success');
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
