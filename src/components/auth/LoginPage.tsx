import React, { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Card, Form, Input, Button, Typography, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      
      if (error) throw error;
      
      // Redirect to admin panel or dashboard on successful login
      navigate('/admin');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in');
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
