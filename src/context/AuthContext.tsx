import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, Profile } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'

type AuthContextType = {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: AuthError | null }>
  signInWithOAuth: (provider: 'google') => Promise<void>
  signOut: () => Promise<boolean> // Updated to return boolean for success/failure
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>
  verifyOTP: (phone: string, token: string) => Promise<boolean>
  sendMobileOTP: (phone: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          // Fetch user profile
          await fetchUserProfile(currentSession.user.id)
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    // Get initial session
    const initializeAuth = async () => {
      setLoading(true)
      const { data: { session: initialSession } } = await supabase.auth.getSession()
      
      if (initialSession) {
        setSession(initialSession)
        setUser(initialSession.user)
        await fetchUserProfile(initialSession.user.id)
      }
      
      setLoading(false)
    }

    initializeAuth()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Fetch user profile from Supabase
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return
      }

      setProfile(data as Profile)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive',
        })
        return { error }
      }

      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      })

      return { error: null }
    } catch (err) {
      console.error('Unexpected error during sign in:', err)
      toast({
        title: 'Sign in failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
      return { error: err as AuthError }
    }
  }

  // Sign up with email and password
  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      // 1. Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      })

      if (error) {
        toast({
          title: 'Sign up failed',
          description: error.message,
          variant: 'destructive',
        })
        return { error }
      }

      // 2. Manually create a profile for the user
      if (data?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            email: email,
            // Combine first and last name to create full_name
            full_name: `${firstName} ${lastName}`,
            // Don't include first_name and last_name as they're not in the table
            email_verified: false,
          }])
          
        if (profileError) {
          console.error('Error creating profile:', profileError)
          // Continue anyway - don't block signup if profile creation fails
          // The user can create their profile later
        }
      }

      toast({
        title: 'Check your email',
        description: 'We sent you a confirmation link to complete your registration.',
      })

      return { error: null }
    } catch (err) {
      console.error('Unexpected error during sign up:', err)
      toast({
        title: 'Sign up failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
      return { error: err as AuthError }
    }
  }

  // Sign in with OAuth provider
  const signInWithOAuth = async (provider: 'google') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (error) {
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive',
        })
      }
    } catch (err) {
      console.error(`Error signing in with ${provider}:`, err)
      toast({
        title: 'Sign in failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Sign out - completely revamped with forced page reload
  const signOut = async () => {
    try {
      console.log('Starting signOut process...');
      
      // Show toast first so user gets immediate feedback
      toast({
        title: 'Signing out...',
        description: 'Please wait while we sign you out.',
      });
      
      // Aggressively clear ALL auth-related storage
      const keysToRemove = [
        // Supabase specific keys
        'supabase.auth.token',
        'supabase.auth.refreshToken',
        'sb-refresh-token',
        'sb-access-token',
        'supabase.auth.event',
        'supabase.auth.callbackUrl',
        // App specific keys
        'userPreferences',
        'lastVisited',
        'portfolioState',
        'finPathUser'
      ];
      
      // Remove specific known keys
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      // Also clear any keys matching patterns
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('supabase.') || key.startsWith('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // First invalidate the session through a direct API call
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        await fetch(`${supabaseUrl}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`
          }
        });
      } catch (directApiError) {
        console.warn('Direct API logout failed:', directApiError);
        // Continue with regular logout even if this fails
      }
      
      // Now call Supabase signOut with explicit scope
      console.log('Calling supabase.auth.signOut()...');
      const { error } = await supabase.auth.signOut({
        scope: 'global' // Sign out from all devices
      });
      
      if (error) {
        console.error('Supabase signOut error:', error);
        // Continue cleanup even if Supabase call failed
      }

      // Clear React state
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // CRITICAL: Force a complete page reload and redirect to login
      // This is the most reliable way to clear all state and auth tokens
      console.log('Redirecting to login page with forced reload...');
      
      // Use a more reliable approach to force reload
      window.location.href = '/login?signout=true&t=' + new Date().getTime();
      
      // As a fallback, also try to reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
      return true;
    } catch (err) {
      console.error('Error signing out:', err);
      toast({
        title: 'Sign out failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      
      // Even if there was an error, try force reload as a last resort
      setTimeout(() => {
        window.location.href = '/login';
        window.location.reload();
      }, 1000);
      
      return false;
    }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        toast({
          title: 'Password reset failed',
          description: error.message,
          variant: 'destructive',
        })
        return { error }
      }

      toast({
        title: 'Check your email',
        description: 'We sent you a password reset link.',
      })

      return { error: null }
    } catch (err) {
      console.error('Error resetting password:', err)
      toast({
        title: 'Password reset failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
      return { error: err as AuthError }
    }
  }

  // Update user profile
  const updateProfile = async (data: Partial<Profile>) => {
    try {
      if (!user) {
        throw new Error('No user logged in')
      }

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id)

      if (error) {
        toast({
          title: 'Profile update failed',
          description: error.message,
          variant: 'destructive',
        })
        return { error }
      }

      // Refresh profile data
      await fetchUserProfile(user.id)

      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      })

      return { error: null }
    } catch (err) {
      console.error('Error updating profile:', err)
      toast({
        title: 'Profile update failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
      return { error: err as Error }
    }
  }

  // Send mobile OTP
  const sendMobileOTP = async (phone: string) => {
    try {
      if (!user) {
        throw new Error('No user logged in')
      }

      // Call RPC function to generate OTP
      const { data, error } = await supabase
        .rpc('generate_mobile_otp', { user_id: user.id })

      if (error) {
        console.error('Error generating OTP:', error)
        toast({
          title: 'OTP generation failed',
          description: error.message,
          variant: 'destructive',
        })
        return false
      }

      // In a real app, you would send this OTP via SMS
      // For demo purposes, we'll just show it in a toast
      toast({
        title: 'OTP sent',
        description: `Your OTP is: ${data}. In a real app, this would be sent via SMS.`,
      })

      return true
    } catch (err) {
      console.error('Error sending OTP:', err)
      toast({
        title: 'OTP sending failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
      return false
    }
  }

  // Verify mobile OTP
  const verifyOTP = async (phone: string, token: string) => {
    try {
      if (!user) {
        throw new Error('No user logged in')
      }

      // Call RPC function to verify OTP
      const { data, error } = await supabase
        .rpc('verify_mobile_otp', { user_id: user.id, otp: token })

      if (error) {
        console.error('Error verifying OTP:', error)
        toast({
          title: 'OTP verification failed',
          description: error.message,
          variant: 'destructive',
        })
        return false
      }

      if (data) {
        toast({
          title: 'OTP verified',
          description: 'Your phone number has been verified.',
        })
        
        // Update profile with verified phone
        await updateProfile({ mobile_number: phone })
        return true
      } else {
        toast({
          title: 'Invalid OTP',
          description: 'The OTP you entered is invalid or has expired.',
          variant: 'destructive',
        })
        return false
      }
    } catch (err) {
      console.error('Error verifying OTP:', err)
      toast({
        title: 'OTP verification failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
      return false
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    resetPassword,
    updateProfile,
    sendMobileOTP,
    verifyOTP
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
