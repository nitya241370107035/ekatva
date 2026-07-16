import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from './config';

export async function loginWithEmail(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function loginWithGoogle(): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function logoutUser(): Promise<void> {
  return signOut(auth);
}
