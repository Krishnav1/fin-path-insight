-- FinPath Insight Authentication Setup
-- Run these commands in the Supabase SQL Editor

-- Enable Email Confirmations
UPDATE auth.config
SET email_confirmation_required = TRUE;

-- Create a secure password policy
ALTER TABLE auth.users
ADD CONSTRAINT password_min_length CHECK (char_length(encrypted_password) >= 8);

-- Create verification tokens table for OTP verification
CREATE TABLE public.verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  token TEXT NOT NULL,
  type TEXT NOT NULL, -- 'email', 'mobile', etc.
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on verification_tokens
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own verification tokens
CREATE POLICY "Users can read their own verification tokens" ON public.verification_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow service role to manage verification tokens
CREATE POLICY "Service role can manage verification tokens" ON public.verification_tokens
  USING (auth.jwt() ? auth.jwt()->>'role' = 'service_role' : false);

-- Create function to mark email as verified
CREATE OR REPLACE FUNCTION public.verify_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email_verified = TRUE
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to mark email as verified when confirmed in auth.users
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.verify_user_email();

-- Create function to handle new user signup with required fields
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
    '', -- first_name (will be updated during profile completion)
    '', -- last_name (will be updated during profile completion)
    NEW.email_confirmed_at IS NOT NULL -- email_verified
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call handle_new_user function on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update profile timestamps
CREATE OR REPLACE FUNCTION public.update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update profile timestamps
CREATE TRIGGER update_profile_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_updated_at();

-- Create function to generate OTP for mobile verification
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

-- Create function to verify mobile OTP
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
  
  -- If valid, delete the OTP and update the profile
  IF valid THEN
    DELETE FROM public.verification_tokens
    WHERE user_id = $1 AND type = 'mobile';
    
    -- You could update a mobile_verified field here if needed
  END IF;
  
  RETURN valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a login history table
CREATE TABLE public.login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on login_history
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own login history
CREATE POLICY "Users can read their own login history" ON public.login_history
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow service role to insert login history
CREATE POLICY "Service role can insert login history" ON public.login_history
  FOR INSERT WITH CHECK (auth.jwt() ? auth.jwt()->>'role' = 'service_role' : false);

-- Create function to record login history
CREATE OR REPLACE FUNCTION public.record_login_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.login_history (user_id, ip_address)
  VALUES (NEW.id, NEW.ip::TEXT);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to record login history
CREATE TRIGGER on_auth_user_login
  AFTER INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.record_login_history();

-- Create a function to check if email exists
CREATE OR REPLACE FUNCTION public.check_email_exists(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.email = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if mobile number exists
CREATE OR REPLACE FUNCTION public.check_mobile_exists(mobile TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.mobile_number = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a table for password reset requests
CREATE TABLE public.password_reset_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on password_reset_requests
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to manage password reset requests
CREATE POLICY "Service role can manage password reset requests" ON public.password_reset_requests
  USING (auth.jwt() ? auth.jwt()->>'role' = 'service_role' : false);

-- Create function to generate password reset token
CREATE OR REPLACE FUNCTION public.generate_password_reset_token(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_id UUID;
  reset_token TEXT;
BEGIN
  -- Get user ID from email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Generate a random token
  reset_token := encode(gen_random_bytes(32), 'hex');
  
  -- Delete any existing tokens for this user
  DELETE FROM public.password_reset_requests
  WHERE user_id = user_id;
  
  -- Insert new token
  INSERT INTO public.password_reset_requests (user_id, token, expires_at)
  VALUES (user_id, reset_token, NOW() + INTERVAL '1 hour');
  
  RETURN reset_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify password reset token
CREATE OR REPLACE FUNCTION public.verify_password_reset_token(reset_token TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get user ID from token if valid and not expired
  SELECT password_reset_requests.user_id INTO user_id
  FROM public.password_reset_requests
  WHERE token = reset_token
    AND expires_at > NOW();
  
  -- Delete the token regardless of validity (one-time use)
  DELETE FROM public.password_reset_requests
  WHERE token = reset_token;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a table for user sessions with additional info
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  device_info TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own sessions
CREATE POLICY "Users can read their own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own sessions
CREATE POLICY "Users can delete their own sessions" ON public.user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create policy to allow service role to manage sessions
CREATE POLICY "Service role can manage sessions" ON public.user_sessions
  USING (auth.jwt() ? auth.jwt()->>'role' = 'service_role' : false);

-- Create function to update session last active timestamp
CREATE OR REPLACE FUNCTION public.update_session_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update session last active timestamp
CREATE TRIGGER update_session_last_active
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_session_last_active();

-- Create a function to complete user profile after signup
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
