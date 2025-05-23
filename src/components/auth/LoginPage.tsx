import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Form, Input, Button, Typography, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  // Use the shared supabase client
// (already imported above)
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    console.log('[LoginPage] Attempting login with:', values.email);
    try {
      const response = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      console.log('[LoginPage] Login response:', response);
      const { error, data } = response;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // Double-check session
      const session = await supabase.auth.getSession();
      console.log('[LoginPage] Session after login:', session);
      if (!session.data.session) {
        setError('Login failed: No session returned. Please confirm your email and try again.');
        setLoading(false);
        return;
      }
      // Redirect after successful login
      navigate('/admin/fingenie');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      console.error('[LoginPage] Unexpected error during login:', err);
    } finally {
      setLoading(false);
    }
  };


  
  const handleSignup = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if email domain is allowed (optional - for restricting to company emails)
      // const emailDomain = values.email.split('@')[1];
      // if (emailDomain !== 'fininsight.com') {
      //   throw new Error('Only FinInsight team emails are allowed to register');
      // }
      
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          // You can add additional data here if needed
          data: {
            requested_role: 'admin' // This will be reviewed by an existing admin
          }
        }
      });
      
      if (error) throw error;
      
      // Show success message or redirect
      setError('Registration successful! Please check your email for verification link.');
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>FinInsight Team</Title>
          <Text type="secondary">
            {mode === 'login' ? 'Sign in to access the admin panel' : 'Create a new admin account'}
          </Text>
        </div>
        
        {error && (
          <Alert 
            message={error} 
            type={error.includes('successful') ? 'success' : 'error'} 
            showIcon 
            style={{ marginBottom: 24 }} 
          />
        )}
        
        <Form
          name="auth-form"
          initialValues={{ remember: true }}
          onFinish={mode === 'login' ? handleLogin : handleSignup}
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="Email" 
              size="large" 
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Password" 
              size="large" 
            />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
              size="large"
            >
              {mode === 'login' ? 'Sign In' : 'Sign Up'}
            </Button>
          </Form.Item>
        </Form>
        
        <Divider plain>Or</Divider>
        
        <Button 
          type="link" 
          block
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        >
          {mode === 'login' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
        </Button>
      </Card>
    </div>
  );
};

export default LoginPage;
