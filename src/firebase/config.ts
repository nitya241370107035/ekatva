import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

// Enable offline persistence
try {
  enableIndexedDbPersistence(db);
} catch (err: any) {
  if (err.code === 'failed-precondition') {
    console.warn('Offline persistence limited: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Browser does not support offline persistence');
  }
}

// Validate Connection to Firestore as per system instructions
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Ekatva: Connected to Firestore successfully.");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('offline')) {
        console.error("Ekatva: Please check your Firebase configuration or internet connection.");
      } else {
        console.warn("Ekatva: Firestore connection test status:", error.message);
      }
    } else {
      console.warn("Ekatva: Firestore connection test status:", error);
    }
  }
}
testConnection();
