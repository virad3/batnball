

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, AuthError, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../services/firebaseClient'; // Use Firebase client
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore'; // Added Timestamp for profile date fields
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
  signInWithGoogle: () => Promise<void>; // Added Google Sign-In
  logout: () => Promise<void>;
  // userProfileType is now part of userProfile
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
        // Fetch UserProfile from Firestore
        const profileDocRef = doc(db, 'profiles', firebaseUser.uid);
        const profileDocSnap = await getDoc(profileDocRef);
        
        // dbProfileData contains fields as stored in Firestore, potentially including Timestamps for dates
        let dbProfileData = profileDocSnap.exists() ? profileDocSnap.data() : {};

        // If profile doesn't exist and user signed in with Google, use Google's info for initial setup
        if (!profileDocSnap.exists()) {
            dbProfileData = { // Initialize with Google's data if available
                username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                profilePicUrl: firebaseUser.photoURL,
                profileType: 'Fan', // Default for new Google sign-ups
            };
            // Persist this initial profile data
            await setDoc(profileDocRef, dbProfileData, { merge: true });
        }
        
        // Convert Firestore Timestamp for date_of_birth to ISO string if it exists
        let dobString: string | null = null;
        const rawDob = dbProfileData.date_of_birth; 

        if (rawDob) { 
            if (rawDob instanceof Timestamp) { 
                dobString = rawDob.toDate().toISOString().split('T')[0];
            } else if (typeof rawDob === 'string') {
                dobString = rawDob;
            }
        }
        
        const dbProfile: Partial<Omit<UserProfile, 'id' | 'email'>> = dbProfileData as Partial<Omit<UserProfile, 'id' | 'email'>>;
        
        setUserProfile({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
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

        const profileDataToSave: Partial<UserProfile> = {
          username: displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '', 
          profileType: credentials.options?.data?.profileType || 'Fan',
        };
        const profileDocRef = doc(db, 'profiles', firebaseUser.uid);
        await setDoc(profileDocRef, profileDataToSave, { merge: true }); 
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
      // User state and profile creation/update will be handled by onAuthStateChanged
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
    signInWithGoogle, // Added
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
