import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Form validation schema
const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetComplete, setResetComplete] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Watch password for strength indicator
  const watchedPassword = watch('password');

  // Check if we have access token from the URL
  useEffect(() => {
    const checkSession = async () => {
      // Check if we have tokens from the state (passed from Auth callback)
      const state = location.state as { accessToken?: string, refreshToken?: string } | undefined;
      
      if (!state?.accessToken) {
        // No token, redirect to forgot password
        toast({
          title: 'Invalid reset link',
          description: 'The password reset link is invalid or has expired. Please request a new one.',
          variant: 'destructive',
        })
        navigate('/forgot-password')
      }
    }
    
    checkSession()
  }, [location, navigate, toast])

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setLoading(true)

    try {
      // Get tokens from state
      const state = location.state as { accessToken?: string, refreshToken?: string };
      
      if (!state?.accessToken) {
        throw new Error('No access token found')
      }
      
      // Set the session from the tokens
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: state.accessToken,
        refresh_token: state.refreshToken || '',
      })
      
      if (sessionError) {
        throw sessionError
      }
      
      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: data.password
      })
      
      if (error) {
        throw error
      }
      
      // Success
      setResetComplete(true)
      toast({
        title: 'Password reset successful',
        description: 'Your password has been reset successfully.',
      })
    } catch (error) {
      console.error('Password reset error:', error)
      toast({
        title: 'Password reset failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 space-y-6">
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {resetComplete ? 'Password Reset Complete' : 'Reset Your Password'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-center">
            {resetComplete 
              ? 'Your password has been reset successfully.'
              : 'Please enter a new password for your account.'}
          </p>
        </div>

        {!resetComplete ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="password" className="block text-sm font-medium">
                New Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={`pl-10 pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-500 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="block text-sm font-medium">
                Confirm New Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-400 hover:text-slate-500 focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Password strength indicators */}
            {watchedPassword && (
              <div className="space-y-2 mt-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Password requirements:</p>
                <ul className="space-y-1 text-sm">
                  <li className={`flex items-center ${watchedPassword.length >= 8 ? 'text-green-500' : 'text-slate-500'}`}>
                    <span className="mr-2">{watchedPassword.length >= 8 ? '✓' : '•'}</span>
                    At least 8 characters
                  </li>
                  <li className={`flex items-center ${/[A-Z]/.test(watchedPassword) ? 'text-green-500' : 'text-slate-500'}`}>
                    <span className="mr-2">{/[A-Z]/.test(watchedPassword) ? '✓' : '•'}</span>
                    At least one uppercase letter
                  </li>
                  <li className={`flex items-center ${/[a-z]/.test(watchedPassword) ? 'text-green-500' : 'text-slate-500'}`}>
                    <span className="mr-2">{/[a-z]/.test(watchedPassword) ? '✓' : '•'}</span>
                    At least one lowercase letter
                  </li>
                  <li className={`flex items-center ${/[0-9]/.test(watchedPassword) ? 'text-green-500' : 'text-slate-500'}`}>
                    <span className="mr-2">{/[0-9]/.test(watchedPassword) ? '✓' : '•'}</span>
                    At least one number
                  </li>
                  <li className={`flex items-center ${/[^A-Za-z0-9]/.test(watchedPassword) ? 'text-green-500' : 'text-slate-500'}`}>
                    <span className="mr-2">{/[^A-Za-z0-9]/.test(watchedPassword) ? '✓' : '•'}</span>
                    At least one special character
                  </li>
                </ul>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6"
            >
              {loading ? 'Resetting password...' : 'Reset Password'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <Button 
              type="button" 
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Sign in with new password
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
