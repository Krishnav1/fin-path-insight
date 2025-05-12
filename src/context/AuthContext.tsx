import { createContext, useContext, useEffect, useState } from 'react'
// import { User } from '@supabase/supabase-js'
// import { supabase } from '@/lib/supabase'

// User type definition
export type User = {
  id: string;
  email: string;
  username?: string;
  avatarUrl?: string;
};

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateUserProfile: (data: { username?: string; avatar_url?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper functions for localStorage
const saveUserToStorage = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user));
};

const getUserFromStorage = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error('Error parsing user from localStorage', e);
    return null;
  }
};

const removeUserFromStorage = () => {
  localStorage.removeItem('user');
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on initial render
  useEffect(() => {
    try {
      const savedUser = getUserFromStorage();
      if (savedUser) {
        setUser(savedUser);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    } finally {
      setLoading(false);
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    // For demo purposes - in a real app you would validate against your API
    // Simple validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    
    // Create a demo user - in real app this would come from your backend
    const newUser = { 
      id: '1', 
      email,
      username: email.split('@')[0],
    };
    
    setUser(newUser);
    saveUserToStorage(newUser);
    return Promise.resolve();
  }

  const signUp = async (email: string, password: string) => {
    // For demo purposes - in a real app you would register with your API
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    
    // Create a new user
    const newUser = { 
      id: '1', 
      email,
      username: email.split('@')[0],
    };
    
    setUser(newUser);
    saveUserToStorage(newUser);
    return Promise.resolve();
  }

  const signOut = async () => {
    setUser(null);
    removeUserFromStorage();
    return Promise.resolve();
  }

  const updateUserProfile = async (data: { username?: string; avatar_url?: string }) => {
    if (!user) throw new Error('No user logged in');
    
    const updatedUser = { 
      ...user, 
      username: data.username || user.username,
      avatarUrl: data.avatar_url || user.avatarUrl
    };
    
    setUser(updatedUser);
    saveUserToStorage(updatedUser);
    return Promise.resolve();
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
