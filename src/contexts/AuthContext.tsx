import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged, UserCredential } from 'firebase/auth';
import { auth } from '../firebase/config';
import { loginWithEmail, registerWithEmail, loginWithGoogle, logoutUser } from '../firebase/auth';
import { getUserProfile, createUserProfile, createWeaverProfile, ensureCooperative } from '../firebase/firestore';
import { UserProfile, WeaverProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  loginGoogle: () => Promise<{ user: User; profile: UserProfile | null }>;
  loginDemo: (role: 'weaver' | 'secretary' | 'buyer') => Promise<UserProfile>;
  registerWeaver: (email: string, password: string, profileData: Omit<WeaverProfile, 'weaverId' | 'cooperativeId' | 'createdAt'>) => Promise<User>;
  registerProfile: (role: 'weaver' | 'secretary' | 'buyer', displayName: string, weaverDetails?: Omit<WeaverProfile, 'weaverId' | 'cooperativeId' | 'createdAt'>) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (currentUser) {
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
    } else {
      setUserProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      const credential = await loginWithEmail(email, password);
      const profile = await getUserProfile(credential.user.uid);
      if (!profile) {
        await logoutUser();
        throw new Error("No profile found. Please register.");
      }
      setUserProfile(profile);
      setCurrentUser(credential.user);
      return profile;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = async (): Promise<{ user: User; profile: UserProfile | null }> => {
    setLoading(true);
    try {
      const credential = await loginWithGoogle();
      const profile = await getUserProfile(credential.user.uid);
      setUserProfile(profile);
      setCurrentUser(credential.user);
      return { user: credential.user, profile };
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = async (role: 'weaver' | 'secretary' | 'buyer'): Promise<UserProfile> => {
    setLoading(true);
    try {
      let uid = '';
      let displayName = '';
      let email = '';
      
      if (role === 'weaver') {
        uid = 'demo-weaver-uid';
        displayName = 'रमेश कुमार (डेमो बुनकर)';
        email = 'weaver@ekatva.org';
      } else if (role === 'secretary') {
        uid = 'demo-secretary-uid';
        displayName = 'अमित शर्मा (डेमो सचिव)';
        email = 'secretary@ekatva.org';
      } else {
        uid = 'demo-buyer-uid';
        displayName = 'राजेश जैन (डेमो क्रेता)';
        email = 'buyer@ekatva.org';
      }

      const mockUser = {
        uid,
        email,
        displayName,
        emailVerified: true,
        isAnonymous: false,
      } as User;

      const profile: UserProfile = {
        uid,
        email,
        role,
        cooperativeId: 'coop1',
        displayName,
        createdAt: new Date().toISOString()
      };

      // Ensure the user profile exists in Firestore so reads retrieve it
      await createUserProfile(uid, profile);

      if (role === 'weaver') {
        await createWeaverProfile(uid, {
          displayName,
          phone: '9876543210',
          skillTags: ['बनारसी', 'जामदानी'],
          experience: 12,
          numberOfLooms: 3,
          dailyCapacity: 2,
          aadharNumber: '123456789012',
          bankAccount: {
            bankName: 'State Bank of India',
            accountNumber: '1234567890',
            ifsc: 'SBIN0001234'
          },
          address: {
            street: 'पीली कोठी, वाराणसी',
            city: 'वाराणसी',
            state: 'उत्तर प्रदेश',
            pincode: '221001'
          }
        });
      }

      setCurrentUser(mockUser);
      setUserProfile(profile);
      return profile;
    } catch (err) {
      console.error("Error setting up demo profile:", err);
      const fallbackProfile: UserProfile = {
        uid: 'demo-' + role + '-uid',
        email: role + '@ekatva.org',
        role,
        cooperativeId: 'coop1',
        displayName: role === 'weaver' ? 'रमेश कुमार (डेमो बुनकर)' : role === 'secretary' ? 'अमित शर्मा (डेमो सचिव)' : 'राजेश जैन (डेमो क्रेता)',
        createdAt: new Date().toISOString()
      };
      setCurrentUser({
        uid: fallbackProfile.uid,
        email: fallbackProfile.email,
        displayName: fallbackProfile.displayName,
        emailVerified: true,
      } as User);
      setUserProfile(fallbackProfile);
      return fallbackProfile;
    } finally {
      setLoading(false);
    }
  };

  const registerWeaver = async (
    email: string,
    password: string,
    profileData: Omit<WeaverProfile, 'weaverId' | 'cooperativeId' | 'createdAt'>
  ): Promise<User> => {
    setLoading(true);
    try {
      // 1. Create cooperative doc if "coop1" doesn't exist yet
      await ensureCooperative('coop1');

      // 2. Register user in Firebase Auth
      const credential = await registerWithEmail(email, password);
      const uid = credential.user.uid;

      // 3. Create User Profile document in 'users' collection
      const userProfileData: UserProfile = {
        uid,
        email,
        role: 'weaver',
        cooperativeId: 'coop1',
        displayName: profileData.displayName,
        createdAt: new Date().toISOString()
      };
      await createUserProfile(uid, userProfileData);

      // 4. Create Weaver Profile document in 'weavers' collection
      const weaverProfileData: WeaverProfile = {
        ...profileData,
        weaverId: uid,
        cooperativeId: 'coop1',
        createdAt: new Date().toISOString()
      };
      await createWeaverProfile(uid, weaverProfileData);

      // Set states
      setCurrentUser(credential.user);
      setUserProfile(userProfileData);

      return credential.user;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerProfile = async (
    role: 'weaver' | 'secretary' | 'buyer',
    displayName: string,
    weaverDetails?: Omit<WeaverProfile, 'weaverId' | 'cooperativeId' | 'createdAt'>
  ): Promise<void> => {
    if (!currentUser) throw new Error("No authenticated user.");
    setLoading(true);
    try {
      const uid = currentUser.uid;
      const email = currentUser.email || '';

      // 1. Create cooperative doc if "coop1" doesn't exist yet
      await ensureCooperative('coop1');

      // 2. Create User Profile document in 'users' collection
      const userProfileData: UserProfile = {
        uid,
        email,
        role,
        cooperativeId: 'coop1',
        displayName,
        createdAt: new Date().toISOString()
      };
      await createUserProfile(uid, userProfileData);

      // 3. Create Weaver Profile document in 'weavers' collection if role is weaver
      if (role === 'weaver' && weaverDetails) {
        const weaverProfileData: WeaverProfile = {
          ...weaverDetails,
          weaverId: uid,
          cooperativeId: 'coop1',
          createdAt: new Date().toISOString()
        };
        await createWeaverProfile(uid, weaverProfileData);
      }

      setUserProfile(userProfileData);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await logoutUser();
      setCurrentUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      login,
      loginGoogle,
      loginDemo,
      registerWeaver,
      registerProfile,
      logout,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
