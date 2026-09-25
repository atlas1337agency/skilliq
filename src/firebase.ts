import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = (firebaseConfig as any).firestoreDatabaseId
  ? initializeFirestore(app, {
      experimentalForceLongPolling: true
    }, (firebaseConfig as any).firestoreDatabaseId)
  : initializeFirestore(app, {
      experimentalForceLongPolling: true
    });
export const googleProvider = new GoogleAuthProvider();
