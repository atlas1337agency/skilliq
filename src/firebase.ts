import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Silence transient WebChannelConnection RPC 'Listen' stream transport warnings in proxy/iframe environments
setLogLevel('silent');

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const firestoreSettings = {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
} as any;

export const db = (firebaseConfig as any).firestoreDatabaseId
  ? initializeFirestore(app, firestoreSettings, (firebaseConfig as any).firestoreDatabaseId)
  : initializeFirestore(app, firestoreSettings);

export const googleProvider = new GoogleAuthProvider();
