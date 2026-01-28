'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Stub user type for development
interface StubUser {
  id: string;
  email: string;
  user_metadata: {
    display_name?: string;
    avatar_url?: string;
  };
}

interface AuthContextType {
  user: StubUser | null;
  session: { user: StubUser } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Stub user for development - simulates a logged-in user
const STUB_USER: StubUser = {
  id: 'stub-user-dev-001',
  email: 'dev@subtaste.local',
  user_metadata: {
    display_name: 'Dev User',
    avatar_url: undefined,
  },
};

// Set to true to simulate logged-in state, false for logged-out
const STUB_LOGGED_IN = true;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StubUser | null>(null);
  const [session, setSession] = useState<{ user: StubUser } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate async auth check
    const timer = setTimeout(() => {
      if (STUB_LOGGED_IN) {
        setUser(STUB_USER);
        setSession({ user: STUB_USER });
      }
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const signIn = async (_email: string, _password: string) => {
    // Stub sign in - always succeeds
    setUser(STUB_USER);
    setSession({ user: STUB_USER });
    return { error: null };
  };

  const signUp = async (_email: string, _password: string) => {
    // Stub sign up - always succeeds
    setUser(STUB_USER);
    setSession({ user: STUB_USER });
    return { error: null };
  };

  const signInWithGoogle = async () => {
    // Stub Google sign in - always succeeds
    setUser(STUB_USER);
    setSession({ user: STUB_USER });
    return { error: null };
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    // Clear local storage
    localStorage.removeItem('subtaste_user_id');
    localStorage.removeItem('subtaste_session_count');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
