import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Form validation schema
const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  mobile: z.string().optional(),
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

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // Step 1: Basic info, Step 2: Password
  const { signUp, signInWithOAuth } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
    watch,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      password: '',
      confirmPassword: '',
    },
  })

  // Watch form values for validation
  const watchedFields = watch()

  // Handle next step in multi-step form
  const handleNextStep = async () => {
    const isValid = await trigger(['firstName', 'lastName', 'email'])
    if (isValid) {
      setStep(2)
    }
  }

  // Handle back to previous step
  const handlePrevStep = () => {
    setStep(1)
  }

  // Handle form submission
  const onSubmit = async (data: SignupFormValues) => {
    setLoading(true)

    try {
      const { error } = await signUp(data.email, data.password, data.firstName, data.lastName)
      
      if (error) {
        // Error is already handled by the auth context with toast
        setLoading(false)
        return
      }
      
      toast({
        title: 'Check your email',
        description: 'We sent you a confirmation link to complete your registration.',
      })
      
      // Redirect to login page
      navigate('/login')
    } catch (error) {
      console.error('Signup error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle OAuth sign in
  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    try {
      await signInWithOAuth(provider)
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 space-y-6">
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Create an account
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {step === 1 ? 'Enter your personal information' : 'Create a secure password'}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-between">
          <div className="w-full flex items-center">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white">
              1
              <div className="absolute -bottom-6 w-16 text-xs text-center text-primary font-medium">
                Details
              </div>
            </div>
            <div className={`h-1 flex-1 ${step === 2 ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
            <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${step === 2 ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
              2
              <div className={`absolute -bottom-6 w-16 text-xs text-center ${step === 2 ? 'text-primary' : 'text-slate-500'} font-medium`}>
                Password
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 pt-4 space-y-4">
          {step === 1 ? (
            // Step 1: Personal details
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="block text-sm font-medium">
                    First Name
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <Input
                      id="firstName"
                      type="text"
                      {...register('firstName')}
                      className={`pl-10 ${errors.firstName ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="John"
                      autoComplete="given-name"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="lastName" className="block text-sm font-medium">
                    Last Name
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <Input
                      id="lastName"
                      type="text"
                      {...register('lastName')}
                      className={`pl-10 ${errors.lastName ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Doe"
                      autoComplete="family-name"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="block text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className={`pl-10 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="name@example.com"
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="mobile" className="block text-sm font-medium">
                  Mobile Number <span className="text-slate-400">(Optional)</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="mobile"
                    type="tel"
                    {...register('mobile')}
                    className="pl-10"
                    placeholder="+1 (555) 123-4567"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <Button 
                type="button" 
                onClick={handleNextStep}
                className="w-full"
              >
                Continue
              </Button>
            </>
          ) : (
            // Step 2: Password creation
            <>
              <div className="space-y-1">
                <Label htmlFor="password" className="block text-sm font-medium">
                  Password
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
                  Confirm Password
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
              {watchedFields.password && (
                <div className="space-y-2 mt-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Password requirements:</p>
                  <ul className="space-y-1 text-sm">
                    <li className={`flex items-center ${watchedFields.password.length >= 8 ? 'text-green-500' : 'text-slate-500'}`}>
                      <span className="mr-2">{watchedFields.password.length >= 8 ? '✓' : '•'}</span>
                      At least 8 characters
                    </li>
                    <li className={`flex items-center ${/[A-Z]/.test(watchedFields.password) ? 'text-green-500' : 'text-slate-500'}`}>
                      <span className="mr-2">{/[A-Z]/.test(watchedFields.password) ? '✓' : '•'}</span>
                      At least one uppercase letter
                    </li>
                    <li className={`flex items-center ${/[a-z]/.test(watchedFields.password) ? 'text-green-500' : 'text-slate-500'}`}>
                      <span className="mr-2">{/[a-z]/.test(watchedFields.password) ? '✓' : '•'}</span>
                      At least one lowercase letter
                    </li>
                    <li className={`flex items-center ${/[0-9]/.test(watchedFields.password) ? 'text-green-500' : 'text-slate-500'}`}>
                      <span className="mr-2">{/[0-9]/.test(watchedFields.password) ? '✓' : '•'}</span>
                      At least one number
                    </li>
                    <li className={`flex items-center ${/[^A-Za-z0-9]/.test(watchedFields.password) ? 'text-green-500' : 'text-slate-500'}`}>
                      <span className="mr-2">{/[^A-Za-z0-9]/.test(watchedFields.password) ? '✓' : '•'}</span>
                      At least one special character
                    </li>
                  </ul>
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handlePrevStep}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </Button>
              </div>
            </>
          )}
        </form>

        <div className="text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
              Sign in
            </Link>
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              Or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthSignIn('google')}
            className="w-full"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
              </g>
            </svg>
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthSignIn('github')}
            className="w-full"
          >
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
            </svg>
            GitHub
          </Button>
        </div>
      </div>
    </div>
  )
}
