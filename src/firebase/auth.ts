import { 
  signInWithEmailAndPassword as fSignInWithEmailAndPassword, 
  createUserWithEmailAndPassword as fCreateUserWithEmailAndPassword, 
  signOut as fSignOut,
  UserCredential,
  GoogleAuthProvider as fGoogleAuthProvider,
  signInWithPopup as fSignInWithPopup,
  onAuthStateChanged as fOnAuthStateChanged
} from 'firebase/auth';
import { auth, isMock } from './config';

const authListeners: ((user: any) => void)[] = [];

export function onAuthStateChanged(authInstance: any, callback: (user: any) => void): () => void {
  if (isMock) {
    authListeners.push(callback);
    
    // Check localStorage for saved session
    const saved = localStorage.getItem('ekatva_mock_user');
    const user = saved ? JSON.parse(saved) : null;
    authInstance.currentUser = user;
    setTimeout(() => callback(user), 0);
    
    return () => {
      const idx = authListeners.indexOf(callback);
      if (idx !== -1) authListeners.splice(idx, 1);
    };
  }
  return fOnAuthStateChanged(authInstance, callback);
}

function notifyAuthChange(user: any) {
  auth.currentUser = user;
  authListeners.forEach(cb => cb(user));
}

// Seed the mock credential accounts on initialize so they can be logged into using the inputs
function seedMockAccounts() {
  try {
    const creds = JSON.parse(localStorage.getItem('ekatva_mock_credentials') || '{}');
    const dbData = JSON.parse(localStorage.getItem('ekatva_mock_firestore') || '{}');
    if (!dbData['users']) dbData['users'] = {};

    const defaultUsers = [
      {
        email: 'weaver@ekatva.org',
        password: 'password',
        uid: 'demo-weaver-uid',
        profile: {
          uid: 'demo-weaver-uid',
          email: 'weaver@ekatva.org',
          role: 'weaver',
          cooperativeId: 'coop1',
          displayName: 'रमेश कुमार (डेमो बुनकर)',
          createdAt: new Date().toISOString()
        }
      },
      {
        email: 'secretary@ekatva.org',
        password: 'password',
        uid: 'demo-secretary-uid',
        profile: {
          uid: 'demo-secretary-uid',
          email: 'secretary@ekatva.org',
          role: 'secretary',
          cooperativeId: 'coop1',
          displayName: 'अमित शर्मा (डेमो सचिव)',
          createdAt: new Date().toISOString()
        }
      },
      {
        email: 'buyer@ekatva.org',
        password: 'password',
        uid: 'demo-buyer-uid',
        profile: {
          uid: 'demo-buyer-uid',
          email: 'buyer@ekatva.org',
          role: 'buyer',
          cooperativeId: 'coop1',
          displayName: 'राजेश जैन (डेमो क्रेता)',
          createdAt: new Date().toISOString()
        }
      }
    ];

    let changed = false;
    for (const user of defaultUsers) {
      const lowerEmail = user.email.toLowerCase();
      if (!creds[lowerEmail]) {
        creds[lowerEmail] = { password: user.password, uid: user.uid };
        changed = true;
      }
      if (!dbData['users'][user.uid]) {
        dbData['users'][user.uid] = user.profile;
        changed = true;
      }
    }

    if (changed) {
      localStorage.setItem('ekatva_mock_credentials', JSON.stringify(creds));
      localStorage.setItem('ekatva_mock_firestore', JSON.stringify(dbData));
    }
  } catch (err) {
    console.error("Failed to seed default mock credentials:", err);
  }
}

if (isMock) {
  seedMockAccounts();
}

export async function loginWithEmail(email: string, password: string): Promise<UserCredential> {
  if (isMock) {
    const creds = JSON.parse(localStorage.getItem('ekatva_mock_credentials') || '{}');
    const lowerEmail = email.toLowerCase();
    const userCred = creds[lowerEmail];
    
    if (!userCred) {
      throw new Error("auth/user-not-found: User not found. Please register or check your spelling.");
    }
    
    if (userCred.password !== password) {
      throw new Error("auth/wrong-password: The password you entered is incorrect.");
    }
    
    // Retrieve the display name from the mock database users collection if it exists
    const dbData = JSON.parse(localStorage.getItem('ekatva_mock_firestore') || '{}');
    const userProfile = dbData['users']?.[userCred.uid];
    const displayName = userProfile?.displayName || email.split('@')[0];
    
    const mockUser = {
      uid: userCred.uid,
      email: lowerEmail,
      displayName,
      emailVerified: true,
      isAnonymous: false,
    } as any;
    
    localStorage.setItem('ekatva_mock_user', JSON.stringify(mockUser));
    notifyAuthChange(mockUser);
    
    return {
      user: mockUser,
    } as UserCredential;
  }
  return fSignInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email: string, password: string): Promise<UserCredential> {
  if (isMock) {
    const creds = JSON.parse(localStorage.getItem('ekatva_mock_credentials') || '{}');
    const lowerEmail = email.toLowerCase();
    
    if (creds[lowerEmail]) {
      throw new Error("auth/email-already-in-use: An account with this email already exists.");
    }
    
    const uid = `mock-uid-registered-${Math.random().toString(36).substring(2, 9)}`;
    creds[lowerEmail] = { password, uid };
    localStorage.setItem('ekatva_mock_credentials', JSON.stringify(creds));
    
    const mockUser = {
      uid,
      email: lowerEmail,
      displayName: email.split('@')[0],
      emailVerified: true,
      isAnonymous: false,
    } as any;
    
    localStorage.setItem('ekatva_mock_user', JSON.stringify(mockUser));
    notifyAuthChange(mockUser);
    
    return {
      user: mockUser,
    } as UserCredential;
  }
  return fCreateUserWithEmailAndPassword(auth, email, password);
}

export async function loginWithGoogle(): Promise<UserCredential> {
  if (isMock) {
    const mockUser = {
      uid: 'mock-uid-google',
      email: 'google-user@ekatva.org',
      displayName: 'गूगल यूजर (Mock Google User)',
      emailVerified: true,
      isAnonymous: false,
    } as any;
    
    localStorage.setItem('ekatva_mock_user', JSON.stringify(mockUser));
    notifyAuthChange(mockUser);
    
    return {
      user: mockUser,
    } as UserCredential;
  }
  const provider = new fGoogleAuthProvider();
  return fSignInWithPopup(auth, provider);
}

export async function logoutUser(): Promise<void> {
  if (isMock) {
    localStorage.removeItem('ekatva_mock_user');
    notifyAuthChange(null);
    return;
  }
  return fSignOut(auth);
}
