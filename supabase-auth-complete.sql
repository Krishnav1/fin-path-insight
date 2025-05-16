-- FinPath Insight - Complete Authentication Setup
-- Run these commands in the Supabase SQL Editor

-- 1. Create profiles table with enhanced user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  mobile_number TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for profiles
-- Allow users to read their own profile
CREATE POLICY "Users can read their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow service role to manage all profiles
CREATE POLICY "Service role can manage all profiles" ON public.profiles
  USING (auth.jwt() ? auth.jwt()->>'role' = 'service_role' : false);

-- 4. Enable Email Confirmations
UPDATE auth.config
SET email_confirmation_required = TRUE;

-- 5. Create verification tokens table for OTP verification
CREATE TABLE IF NOT EXISTS public.verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  token TEXT NOT NULL,
  type TEXT NOT NULL, -- 'email', 'mobile', etc.
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable Row Level Security on verification_tokens
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- 7. Create policy to allow users to read their own verification tokens
CREATE POLICY "Users can read their own verification tokens" ON public.verification_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- 8. Create policy to allow service role to manage verification tokens
CREATE POLICY "Service role can manage verification tokens" ON public.verification_tokens
  USING (auth.jwt() ? auth.jwt()->>'role' = 'service_role' : false);

-- 9. Create function to mark email as verified
CREATE OR REPLACE FUNCTION public.verify_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email_verified = TRUE
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create trigger to mark email as verified when confirmed in auth.users
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.verify_user_email();

-- 11. Create function to handle new user signup with required fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name,
    last_name,
    email_verified
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create trigger to call handle_new_user function on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 13. Create function to update profile timestamps
CREATE OR REPLACE FUNCTION public.update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create trigger to update profile timestamps
CREATE TRIGGER update_profile_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_updated_at();

-- 15. Create function to generate OTP for mobile verification
CREATE OR REPLACE FUNCTION public.generate_mobile_otp(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  otp TEXT;
BEGIN
  -- Generate a 6-digit OTP
  otp := floor(random() * 900000 + 100000)::TEXT;
  
  -- Delete any existing OTPs for this user
  DELETE FROM public.verification_tokens
  WHERE user_id = $1 AND type = 'mobile';
  
  -- Insert new OTP
  INSERT INTO public.verification_tokens (user_id, token, type, expires_at)
  VALUES ($1, otp, 'mobile', NOW() + INTERVAL '15 minutes');
  
  RETURN otp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Create function to verify mobile OTP
CREATE OR REPLACE FUNCTION public.verify_mobile_otp(user_id UUID, otp TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  valid BOOLEAN;
BEGIN
  -- Check if OTP is valid and not expired
  SELECT EXISTS (
    SELECT 1
    FROM public.verification_tokens
    WHERE user_id = $1
      AND token = $2
      AND type = 'mobile'
      AND expires_at > NOW()
  ) INTO valid;
  
  -- If valid, delete the OTP
  IF valid THEN
    DELETE FROM public.verification_tokens
    WHERE user_id = $1 AND type = 'mobile';
  END IF;
  
  RETURN valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Create a login history table
CREATE TABLE IF NOT EXISTS public.login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. Enable Row Level Security on login_history
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- 19. Create policy to allow users to read their own login history
CREATE POLICY "Users can read their own login history" ON public.login_history
  FOR SELECT USING (auth.uid() = user_id);

-- 20. Create policy to allow service role to insert login history
CREATE POLICY "Service role can insert login history" ON public.login_history
  FOR INSERT WITH CHECK (auth.jwt() ? auth.jwt()->>'role' = 'service_role' : false);

-- 21. Create function to record login history
CREATE OR REPLACE FUNCTION public.record_login_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.login_history (user_id, ip_address)
  VALUES (NEW.id, NEW.ip::TEXT);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 22. Create trigger to record login history
CREATE TRIGGER on_auth_user_login
  AFTER INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.record_login_history();

-- 23. Create a table for password reset requests
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 24. Enable Row Level Security on password_reset_requests
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- 25. Create policy to allow service role to manage password reset requests
CREATE POLICY "Service role can manage password reset requests" ON public.password_reset_requests
  USING (auth.jwt() ? auth.jwt()->>'role' = 'service_role' : false);

-- 26. Create a table for user sessions with additional info
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  device_info TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 27. Enable Row Level Security on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 28. Create policy to allow users to read their own sessions
CREATE POLICY "Users can read their own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- 29. Create policy to allow users to delete their own sessions
CREATE POLICY "Users can delete their own sessions" ON public.user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- 30. Create policy to allow service role to manage sessions
CREATE POLICY "Service role can manage sessions" ON public.user_sessions
  USING (auth.jwt() ? auth.jwt()->>'role' = 'service_role' : false);

-- 31. Create function to update session last active timestamp
CREATE OR REPLACE FUNCTION public.update_session_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 32. Create trigger to update session last active timestamp
CREATE TRIGGER update_session_last_active
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_session_last_active();

-- 33. Create a function to complete user profile after signup
CREATE OR REPLACE FUNCTION public.complete_user_profile(
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  mobile_number TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profiles
  SET
    first_name = $2,
    last_name = $3,
    mobile_number = $4,
    date_of_birth = $5,
    gender = $6,
    address = $7,
    city = $8,
    state = $9,
    country = $10,
    postal_code = $11,
    updated_at = NOW()
  WHERE id = $1;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 34. Create chat_history table for storing user chat messages
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 35. Enable Row Level Security on chat_history
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- 36. Create policies for chat_history
-- Allow users to read their own chat history
CREATE POLICY "Users can read their own chat history" ON public.chat_history
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert into their own chat history
CREATE POLICY "Users can insert into their own chat history" ON public.chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow service role to manage all chat history
CREATE POLICY "Service role can manage all chat history" ON public.chat_history
  USING (auth.jwt() ? auth.jwt()->>'role' = 'service_role' : false);

-- 37. Create investment_reports table for storing user investment reports
CREATE TABLE IF NOT EXISTS public.investment_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  ticker TEXT NOT NULL,
  report TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 38. Enable Row Level Security on investment_reports
ALTER TABLE public.investment_reports ENABLE ROW LEVEL SECURITY;

-- 39. Create policies for investment_reports
-- Allow users to read their own investment reports
CREATE POLICY "Users can read their own investment reports" ON public.investment_reports
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert into their own investment reports
CREATE POLICY "Users can insert into their own investment reports" ON public.investment_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow service role to manage all investment reports
CREATE POLICY "Service role can manage all investment reports" ON public.investment_reports
  USING (auth.jwt() ? auth.jwt()->>'role' = 'service_role' : false);

-- 40. Allow public access to read investment reports (for sharing)
CREATE POLICY "Public can read investment reports" ON public.investment_reports
  FOR SELECT USING (true);
