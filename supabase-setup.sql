-- FinPath Insight Supabase Setup SQL
-- This script sets up the necessary tables and functions for the FinPath Insight application

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table to store user profile information
CREATE TABLE public.profiles (
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

-- Enable Row Level Security on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can read their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create chat_history table to store user conversations
CREATE TABLE public.chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  is_user BOOLEAN NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on chat_history
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own chat history
CREATE POLICY "Users can read their own chat history" ON public.chat_history
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert into their own chat history
CREATE POLICY "Users can insert into their own chat history" ON public.chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow service role to access all chat history (for Netlify functions)
CREATE POLICY "Service role can access all chat history" ON public.chat_history
  USING (auth.jwt() ? auth.jwt()->>'role' = 'service_role' : false);

-- Create policy to allow service role to insert chat history (for Netlify functions)
CREATE POLICY "Service role can insert chat history" ON public.chat_history
  FOR INSERT WITH CHECK (auth.jwt() ? auth.jwt()->>'role' = 'service_role' : false);

-- Create investment_reports table to store generated investment reports
CREATE TABLE public.investment_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticker TEXT NOT NULL,
  report TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on investment_reports
ALTER TABLE public.investment_reports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all investment reports
CREATE POLICY "Authenticated users can read investment reports" ON public.investment_reports
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to insert investment reports
CREATE POLICY "Authenticated users can insert investment reports" ON public.investment_reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow anonymous users to read investment reports (for public access)
CREATE POLICY "Anonymous users can read investment reports" ON public.investment_reports
  FOR SELECT USING (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call handle_new_user function on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
