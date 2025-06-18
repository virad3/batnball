
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, AuthError } from 'firebase/auth';
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
        const dbProfileData = profileDocSnap.exists() ? profileDocSnap.data() : {};

        // Cast dbProfileData to what we expect from DB, allowing optional fields
        // This makes dbProfile.username and dbProfile.profilePicUrl accessible if they exist
        const dbProfile: Partial<Omit<UserProfile, 'id' | 'email'>> = dbProfileData as Partial<Omit<UserProfile, 'id' | 'email'>>;

        // Convert Firestore Timestamp for date_of_birth to ISO string if it exists
        let dobString: string | null = null;
        if (dbProfile.date_of_birth) {
            if (dbProfile.date_of_birth instanceof Timestamp) {
                dobString = (dbProfile.date_of_birth as Timestamp).toDate().toISOString().split('T')[0];
            } else if (typeof dbProfile.date_of_birth === 'string') {
                // If it's already a string, assume it's in correct format or handle as needed
                dobString = dbProfile.date_of_birth;
            }
        }
        
        setUserProfile({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          username: firebaseUser.displayName || dbProfile.username || firebaseUser.email?.split('@')[0] || 'User',
          profileType: dbProfile.profileType || 'Fan',
          profilePicUrl: firebaseUser.photoURL || dbProfile.profilePicUrl,
          // Spread other fields, ensuring date_of_birth uses the processed string
          location: dbProfile.location ?? null,
          date_of_birth: dobString, // Use the processed string
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
      // User state will be updated by onAuthStateChanged
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
        // Update Firebase Auth profile (displayName)
        const displayName = credentials.options?.data?.username;
        if (displayName) {
          await updateProfile(firebaseUser, { displayName });
        }

        // Create a document in Firestore 'profiles' collection
        // Note: UserProfile type allows date_of_birth as string (YYYY-MM-DD),
        // dataService.updateUserProfile converts to Timestamp before saving.
        // Here, for initial creation, we don't have date_of_birth, so it's fine.
        const profileDataToSave: Partial<UserProfile> = {
          // id: firebaseUser.uid, // Not needed, doc ID is UID
          username: displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '', // Store email in profile for consistency if needed, though auth has it
          profileType: credentials.options?.data?.profileType || 'Fan',
          // profilePicUrl will be initially null or from auth if set by provider
          // Other fields like location, dob will be undefined initially
        };
        const profileDocRef = doc(db, 'profiles', firebaseUser.uid);
        await setDoc(profileDocRef, profileDataToSave, { merge: true }); // Use merge to be safe
      }
      // User state will be updated by onAuthStateChanged
    } catch (e:any) {
      setError(e as AuthError);
      console.error("Sign up error:", e);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
      // User state will be cleared by onAuthStateChanged
    } catch (e:any) {
      setError(e as AuthError);
      console.error("Logout error:", e);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    userProfile, // Provide the combined UserProfile
    loading,
    error,
    loginWithPassword,
    signUpWithPassword,
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
