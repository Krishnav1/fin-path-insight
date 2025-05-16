import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { User, Phone, MapPin, Calendar } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Profile } from '@/lib/supabase'

// Form validation schema
const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  mobile: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function CompleteProfile() {
  const [loading, setLoading] = useState(false)
  const [verifyingMobile, setVerifyingMobile] = useState(false)
  const [otp, setOtp] = useState('')
  const { user, profile, updateProfile, sendMobileOTP, verifyOTP } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      mobile: '',
      dateOfBirth: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
  });

  // Populate form with existing profile data if available
  useEffect(() => {
    if (profile) {
      setValue('firstName', profile.first_name || '')
      setValue('lastName', profile.last_name || '')
      setValue('mobile', profile.mobile_number || '')
      setValue('dateOfBirth', profile.date_of_birth ? new Date(profile.date_of_birth).toISOString().split('T')[0] : '')
      setValue('address', profile.address || '')
      setValue('city', profile.city || '')
      setValue('state', profile.state || '')
      setValue('country', profile.country || '')
      setValue('postalCode', profile.postal_code || '')
    }
  }, [profile, setValue])

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  const onSubmit = async (data: ProfileFormValues) => {
    setLoading(true)

    try {
      const { error } = await updateProfile({
        first_name: data.firstName,
        last_name: data.lastName,
        mobile_number: data.mobile,
        date_of_birth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postal_code: data.postalCode,
      } as Partial<Profile>)
      
      if (error) {
        setLoading(false)
        return
      }
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      })
      
      // Redirect to dashboard
      navigate('/dashboard')
    } catch (error) {
      console.error('Profile update error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendOTP = async () => {
    // Get current form values without submission
    const currentMobile = watch('mobile')
    
    if (currentMobile) {
      const success = await sendMobileOTP(currentMobile)
      if (success === true) {
        setVerifyingMobile(true)
      }
    } else {
      toast({
        title: 'Mobile number required',
        description: 'Please enter a valid mobile number to verify.',
        variant: 'destructive',
      })
    }
  }

  const handleVerifyOTP = async () => {
    // Get current form values without submission
    const currentMobile = watch('mobile')
    
    if (currentMobile && otp) {
      const success = await verifyOTP(currentMobile, otp)
      if (success === true) {
        setVerifyingMobile(false)
        setOtp('')
        toast({
          title: 'Mobile verified',
          description: 'Your mobile number has been verified successfully.',
        })
      }
    }
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 space-y-6">
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Complete your profile</h1>
          <p className="text-slate-500 dark:text-slate-400">Please provide your information to complete your profile</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-slate-900 dark:text-white">Personal Information</h2>
              
              <div className="space-y-1">
                <Label htmlFor="firstName" className="block text-sm font-medium">
                  First Name *
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
                  Last Name *
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

              <div className="space-y-1">
                <Label htmlFor="mobile" className="block text-sm font-medium">
                  Mobile Number
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="mobile"
                    type="tel"
                    {...register('mobile')}
                    className="pl-10 pr-24"
                    placeholder="+1 (555) 123-4567"
                    autoComplete="tel"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <Button 
                      type="button" 
                      variant="ghost"
                      size="sm"
                      onClick={handleSendOTP}
                      className="h-8 px-3 text-xs"
                    >
                      Verify
                    </Button>
                  </div>
                </div>
              </div>

              {verifyingMobile && (
                <div className="space-y-1">
                  <Label htmlFor="otp" className="block text-sm font-medium">
                    Verification Code
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="flex-1"
                      placeholder="Enter OTP"
                    />
                    <Button 
                      type="button" 
                      onClick={handleVerifyOTP}
                      size="sm"
                    >
                      Submit
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="dateOfBirth" className="block text-sm font-medium">
                  Date of Birth
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth')}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-slate-900 dark:text-white">Address Information</h2>
              
              <div className="space-y-1">
                <Label htmlFor="address" className="block text-sm font-medium">
                  Address
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="address"
                    type="text"
                    {...register('address')}
                    className="pl-10"
                    placeholder="123 Main St"
                    autoComplete="street-address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="city" className="block text-sm font-medium">
                    City
                  </Label>
                  <Input
                    id="city"
                    type="text"
                    {...register('city')}
                    placeholder="New York"
                    autoComplete="address-level2"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="state" className="block text-sm font-medium">
                    State
                  </Label>
                  <Input
                    id="state"
                    type="text"
                    {...register('state')}
                    placeholder="NY"
                    autoComplete="address-level1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="country" className="block text-sm font-medium">
                    Country
                  </Label>
                  <Input
                    id="country"
                    type="text"
                    {...register('country')}
                    placeholder="United States"
                    autoComplete="country-name"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="postalCode" className="block text-sm font-medium">
                    Postal Code
                  </Label>
                  <Input
                    id="postalCode"
                    type="text"
                    {...register('postalCode')}
                    placeholder="10001"
                    autoComplete="postal-code"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Skip for now
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
