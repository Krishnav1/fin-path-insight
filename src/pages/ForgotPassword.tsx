import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Mail, ArrowLeft } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Form validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setLoading(true)

    try {
      const { error } = await resetPassword(data.email)
      
      if (error) {
        // Error is already handled by the auth context with toast
        setLoading(false)
        return
      }
      
      setEmailSent(true)
    } catch (error) {
      console.error('Password reset error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
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
            {emailSent ? 'Check your email' : 'Forgot password?'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-center">
            {emailSent 
              ? 'We sent you a password reset link. Please check your email.'
              : 'Enter your email address and we\'ll send you a link to reset your password.'}
          </p>
        </div>

        {!emailSent ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Sending reset link...' : 'Send reset link'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <Button 
              type="button" 
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Return to login
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setEmailSent(false)}
              className="w-full"
            >
              Try another email
            </Button>
          </div>
        )}

        <div className="text-center">
          <Link 
            to="/login" 
            className="inline-flex items-center text-sm text-primary hover:text-primary-dark"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
