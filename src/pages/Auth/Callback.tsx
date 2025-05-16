import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash and search params
        const hash = window.location.hash
        const searchParams = new URLSearchParams(window.location.search)
        
        // Check if this is a password reset flow
        const isPasswordReset = searchParams.get('type') === 'recovery'
        
        // Check if this is an email verification flow
        const isEmailVerification = searchParams.get('type') === 'signup'
        
        // Handle password reset flow
        if (isPasswordReset) {
          navigate('/reset-password', { 
            state: { 
              accessToken: searchParams.get('access_token'),
              refreshToken: searchParams.get('refresh_token')
            }
          })
          return
        }
        
        // Exchange the code for a session (OAuth and magic link flows)
        if (hash || searchParams.has('code')) {
          const { data, error } = await supabase.auth.getSession()
          
          if (error) {
            throw error
          }
          
          if (data?.session) {
            // If email verification, check if profile is complete
            if (isEmailVerification) {
              // Fetch user profile
              const { data: profileData } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', data.session.user.id)
                .single()
                
              if (!profileData?.first_name || !profileData?.last_name) {
                navigate('/complete-profile')
                return
              }
            }
            
            // Redirect to dashboard
            navigate('/dashboard')
            return
          }
        }
        
        // If we get here, something went wrong
        setError('Authentication failed. Please try again.')
        setTimeout(() => navigate('/login'), 3000)
      } catch (error) {
        console.error('Auth callback error:', error)
        setError('An unexpected error occurred. Redirecting to login...')
        setTimeout(() => navigate('/login'), 3000)
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 space-y-6 text-center">
        {error ? (
          <>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Authentication Failed</h1>
            <p className="text-slate-500 dark:text-slate-400">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Authenticating</h1>
            <p className="text-slate-500 dark:text-slate-400">Please wait while we complete the authentication process...</p>
          </>
        )}
      </div>
    </div>
  )
}
