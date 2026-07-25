import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

export const isMock = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('...');

export let app: any;
export let auth: any;
export let db: any;
export let storage: any;

if (isMock) {
  console.log("Ekatva: Running in OFFLINE MOCK MODE. No valid Firebase API key configured.");
  app = { name: '[MockApp]' };
  auth = { currentUser: null };
  db = { type: 'MockFirestore', firestoreDatabaseId: firebaseConfig.firestoreDatabaseId };
  storage = { type: 'MockStorage' };
} else {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    storage = getStorage(app);

    // Enable offline persistence
    enableIndexedDbPersistence(db).catch((err: any) => {
      if (err.code === 'failed-precondition') {
        console.warn('Offline persistence limited: multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Browser does not support offline persistence');
      }
    });

    // Validate Connection to Firestore as per system instructions
    const testConnection = async () => {
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
    };
    testConnection();
  } catch (error) {
    console.error("Firebase real initialization failed, fallback to mock mode:", error);
    app = { name: '[MockApp]' };
    auth = { currentUser: null };
    db = { type: 'MockFirestore', firestoreDatabaseId: firebaseConfig.firestoreDatabaseId };
    storage = { type: 'MockStorage' };
  }
}
