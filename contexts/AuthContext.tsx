
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User, AuthError, SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types'; // For profileType

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  loginWithPassword: (credentials: SignUpWithPasswordCredentials) => Promise<void>;
  signUpWithPassword: (credentials: SignUpWithPasswordCredentials & { options?: { data?: Record<string, any> } }) => Promise<void>;
  logout: () => Promise<void>;
  userProfileType: UserProfile['profileType'] | null; // To store profile type from signup
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfileType, setUserProfileType] = useState<UserProfile['profileType'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    setLoading(true);
    const getSession = async () => {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user?.user_metadata?.profile_type) {
            setUserProfileType(currentSession.user.user_metadata.profile_type as UserProfile['profileType']);
        }
        setLoading(false);
    };
    getSession();


    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        console.log("Auth state changed, event:", _event, "session:", currentSession); // For debugging metadata updates
        setLoading(true);
        setError(null);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
         if (currentSession?.user?.user_metadata?.profile_type) {
            setUserProfileType(currentSession.user.user_metadata.profile_type as UserProfile['profileType']);
        } else if (!currentSession) {
            setUserProfileType(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const loginWithPassword = async (credentials: SignUpWithPasswordCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword(credentials);
      if (loginError) throw loginError;
      // Session and user state will be updated by onAuthStateChange
    } catch (e) {
      setError(e as AuthError);
      console.error("Login error:", e);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithPassword = async (credentials: SignUpWithPasswordCredentials & { options?: { data?: Record<string, any> } }) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp(credentials);
      if (signUpError) throw signUpError;
      if (data.user && credentials.options?.data) {
        // If sign up is successful and there's user_metadata, update the user
        // This is mainly for immediately available metadata. Profile type might be here.
        const { error: updateError } = await supabase.auth.updateUser({
            data: credentials.options.data
        });
        if (updateError) console.warn("Error updating user metadata post-signup:", updateError);
        else if(credentials.options.data.profile_type) {
            // Optimistically set profile type if provided
            setUserProfileType(credentials.options.data.profile_type as UserProfile['profileType']);
        }
      }
      // Session and user state will be updated by onAuthStateChange after email confirmation (if enabled)
    } catch (e) {
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
      const { error: logoutError } = await supabase.auth.signOut();
      if (logoutError) throw logoutError;
      // Session and user state will be cleared by onAuthStateChange
    } catch (e) {
      setError(e as AuthError);
      console.error("Logout error:", e);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    loading,
    error,
    loginWithPassword,
    signUpWithPassword,
    logout,
    userProfileType
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
