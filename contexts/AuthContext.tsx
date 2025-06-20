

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import type { User, AuthError } from 'firebase/auth';
import { auth, db, Timestamp } from '../services/firebaseClient'; // Use Firebase client and re-exported Timestamp
import { UserProfile } from '../types';

interface FirebaseSignUpCredentials {
  email: string;
  password?: string; // Password might not be needed for all providers
  options?: {
    data?: Partial<Pick<UserProfile, 'username' | 'profileType'>> & Record<string, any>; // For username, profileType on signup
  };
}
interface FirebaseLoginCredentials {
    email: string;
    password?: string;
}

interface AuthContextType {
  user: User | null; // Firebase User object
  userProfile: UserProfile | null; // Our application's UserProfile
  loading: boolean;
  error: AuthError | Error | null; // Can be Firebase AuthError or general Error
  loginWithPassword: (credentials: FirebaseLoginCredentials) => Promise<void>;
  signUpWithPassword: (credentials: FirebaseSignUpCredentials) => Promise<void>;
  signInWithGoogle: () => Promise<void>; 
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);
      setUser(firebaseUser);
      if (firebaseUser) {
        const profileDocRef = db.collection('profiles').doc(firebaseUser.uid); // v8 compat
        const profileDocSnap = await profileDocRef.get(); // v8 compat
        
        let dbProfileData = profileDocSnap.exists ? profileDocSnap.data() : {};

        if (!profileDocSnap.exists) {
            let defaultProfileType: UserProfile['profileType'] = 'Fan'; 
            
            dbProfileData = { 
                username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                profilePicUrl: firebaseUser.photoURL,
                profileType: defaultProfileType, 
                location: null,
                date_of_birth: null,
                mobile_number: null,
                player_role: null,
                batting_style: null,
                bowling_style: null,
                achievements: [],
                teamIds: [], // Ensure teamIds is initialized for new profiles
            };
            await profileDocRef.set({ // v8 compat
                ...dbProfileData, 
                email: firebaseUser.email, 
            }, { merge: true });
        }
        
        let dobString: string | null = null;
        const rawDob = dbProfileData?.date_of_birth; // Add optional chaining for safety

        if (rawDob) { 
            if (rawDob instanceof Timestamp) { 
                dobString = rawDob.toDate().toISOString().split('T')[0];
            } else if (typeof rawDob === 'string') {
                // Attempt to parse string to date, then format. Or assume it's already YYYY-MM-DD.
                try {
                    const parsedDate = new Date(rawDob);
                    if (!isNaN(parsedDate.getTime())) {
                        dobString = parsedDate.toISOString().split('T')[0];
                    } else {
                        // If it's not a valid ISO string, but might be 'YYYY-MM-DD'
                        if (/^\d{4}-\d{2}-\d{2}$/.test(rawDob)) {
                           dobString = rawDob;
                        }
                    }
                } catch (e) {
                    // Could not parse, maybe it's already in the desired format or invalid
                     if (/^\d{4}-\d{2}-\d{2}$/.test(rawDob)) {
                       dobString = rawDob;
                     }
                }
            }
        }
        
        const dbProfile: Partial<UserProfile> = dbProfileData as Partial<UserProfile>;
        
        setUserProfile({
          id: firebaseUser.uid,
          email: firebaseUser.email || dbProfile.email || '', 
          username: firebaseUser.displayName || dbProfile.username || firebaseUser.email?.split('@')[0] || 'User',
          profileType: dbProfile.profileType || 'Fan',
          profilePicUrl: firebaseUser.photoURL || dbProfile.profilePicUrl,
          location: dbProfile.location ?? null,
          date_of_birth: dobString, 
          mobile_number: dbProfile.mobile_number ?? null,
          player_role: dbProfile.player_role ?? null,
          batting_style: dbProfile.batting_style ?? null,
          bowling_style: dbProfile.bowling_style ?? null,
          achievements: dbProfile.achievements || [],
          teamIds: dbProfile.teamIds || [], // Ensure teamIds is always an array
        });

      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithPassword = async (credentials: FirebaseLoginCredentials) => {
    setLoading(true);
    setError(null);
    try {
      if (!credentials.password) throw new Error("Password is required for login.");
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    } catch (e:any) {
      setError(e as AuthError);
      console.error("Login error:", e);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithPassword = async (credentials: FirebaseSignUpCredentials) => {
    setLoading(true);
    setError(null);
    try {
      if (!credentials.password) throw new Error("Password is required for signup.");
      const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        const displayName = credentials.options?.data?.username;
        if (displayName) {
          await updateProfile(firebaseUser, { displayName });
        }

        const profileDataToSave: Omit<UserProfile, 'id' | 'achievements'> & { achievements?: string[], teamIds?: string[] } = {
          username: displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '', 
          profileType: credentials.options?.data?.profileType || 'Fan',
          profilePicUrl: firebaseUser.photoURL || null, 
          location: null,
          date_of_birth: null,
          mobile_number: null,
          player_role: null,
          batting_style: null,
          bowling_style: null,
          achievements: [], 
          teamIds: [], // Initialize teamIds
        };
        const profileDocRef = db.collection('profiles').doc(firebaseUser.uid); // v8 compat
        await profileDocRef.set(profileDataToSave);  // v8 compat
      }
    } catch (e:any) {
      setError(e as AuthError);
      console.error("Sign up error:", e);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      setError(e as AuthError);
      console.error("Google sign-in error:", e);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
    } catch (e:any) {
      setError(e as AuthError);
      console.error("Logout error:", e);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    userProfile, 
    loading,
    error,
    loginWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
