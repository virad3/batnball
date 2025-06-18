

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
        const profileDocRef = doc(db, 'profiles', firebaseUser.uid);
        const profileDocSnap = await getDoc(profileDocRef);
        
        let dbProfileData = profileDocSnap.exists() ? profileDocSnap.data() : {};

        if (!profileDocSnap.exists()) {
            // Default profileType for new Google sign-ups or if signUpWithPassword didn't set one (though it should)
            let defaultProfileType: UserProfile['profileType'] = 'Fan'; 
            // If the firebaseUser object has a profileType (e.g., passed during signup or from a custom claim), use it.
            // This is a placeholder for a more complex scenario; typically, profileType comes from options.data.
            // For Google Sign-In, we rely on the options.data.profileType if provided, otherwise default.
            // The crucial part is that `signUpWithPassword` sets it, and for Google, it's 'Fan' or what's in Firestore.

            // The profile type for Google users will be 'Fan' unless they update it later.
            // Username and photoURL will come directly from Google.
            dbProfileData = { 
                username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                profilePicUrl: firebaseUser.photoURL, // This will pick up Google's photo
                profileType: defaultProfileType, 
                // Ensure other fields have defaults if necessary
                location: null,
                date_of_birth: null,
                mobile_number: null,
                player_role: null,
                batting_style: null,
                bowling_style: null,
                achievements: [],
            };
            await setDoc(profileDocRef, {
                ...dbProfileData, // Persist default data for new user
                email: firebaseUser.email, // Store email in profile as well
            }, { merge: true });
        }
        
        let dobString: string | null = null;
        const rawDob = dbProfileData.date_of_birth; 

        if (rawDob) { 
            if (rawDob instanceof Timestamp) { 
                dobString = rawDob.toDate().toISOString().split('T')[0];
            } else if (typeof rawDob === 'string') {
                dobString = rawDob;
            }
        }
        
        const dbProfile: Partial<UserProfile> = dbProfileData as Partial<UserProfile>;
        
        setUserProfile({
          id: firebaseUser.uid,
          email: firebaseUser.email || dbProfile.email || '', // Ensure email is present
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
      // onAuthStateChanged will handle setting user and userProfile
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

        // Prepare UserProfile data for Firestore
        const profileDataToSave: Omit<UserProfile, 'id' | 'achievements'> & { achievements?: string[] } = {
          username: displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '', 
          profileType: credentials.options?.data?.profileType || 'Fan',
          profilePicUrl: firebaseUser.photoURL || null, // Firebase user photoURL might be null initially
          location: null,
          date_of_birth: null,
          mobile_number: null,
          player_role: null,
          batting_style: null,
          bowling_style: null,
          achievements: [], // Initialize achievements
        };
        const profileDocRef = doc(db, 'profiles', firebaseUser.uid);
        await setDoc(profileDocRef, profileDataToSave); 
        // onAuthStateChanged will set userProfile based on this
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
      // onAuthStateChanged will clear user and userProfile
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
