import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '../utils/emailService.js';
import { generateOTP, generateToken, hashToken } from '../utils/otpService.js';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d', // Default to 90 days
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, contactNumber, address } = req.body;

    // Validate required fields
    if (!name || !email || !password || !contactNumber || !address) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'Please provide name, email, password, contact number, and full address.' 
      });
    }

    // Validate address fields
    const { street, city, state, zipCode, country } = address;
    if (!street || !city || !state || !zipCode || !country) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'Please provide complete address with street, city, state, zip code, and country.' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(400).json({ 
          status: 'fail', 
          message: 'Email already registered. Please login instead.', 
          code: 'EMAIL_IN_USE' 
        });
      } else {
        // User exists but email not verified - allow re-registration
        await User.findByIdAndDelete(existingUser._id);
      }
    }

    // Generate OTP for email verification
    const otp = generateOTP(6);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash the OTP for storage
    const hashedOTP = await bcrypt.hash(otp, 12);

    // Create new user with verification token
    const newUser = await User.create({
      name,
      email,
      password,
      contactNumber,
      address,
      emailVerificationToken: hashedOTP,
      emailVerificationTokenExpires: otpExpiry,
      isEmailVerified: false
    });

    // Send verification email with OTP
    try {
      await sendVerificationEmail(email, otp);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with user creation even if email fails
    }

    // Send response
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully. Please check your email for verification code.',
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          requiresVerification: true
        },
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle duplicate email error (code 11000)
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(400).json({
        status: 'fail',
        message: 'This email address is already in use. Please use a different email.'
      });
    }
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(el => el.message);
      const message = `Invalid input data. ${errors.join('. ')}`;
      return res.status(400).json({
        status: 'fail',
        message
      });
    }
    
    res.status(400).json({
      status: 'fail',
      message: error.message || 'An error occurred during signup'
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and verification code.'
      });
    }

    // Find user with the provided email
    const user = await User.findOne({
      email,
      emailVerificationTokenExpires: { $gt: Date.now() } // Token not expired
    });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid or expired verification code. Please request a new one.'
      });
    }

    // Verify OTP
    const isValidOTP = await bcrypt.compare(otp, user.emailVerificationToken);
    if (!isValidOTP) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid verification code. Please try again.'
      });
    }

    // Mark email as verified and remove verification token
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // Generate token and send response
    const token = signToken(user._id);

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully.',
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isEmailVerified: true
        }
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during email verification.'
    });
  }
};

export const resendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide your email address.'
      });
    }

    // Find user with the provided email
    const user = await User.findOne({ email, isEmailVerified: false });

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found or already verified.'
      });
    }

    // Generate new OTP
    const otp = generateOTP(6);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash the OTP for storage
    const hashedOTP = await bcrypt.hash(otp, 12);

    // Update user with new verification token
    user.emailVerificationToken = hashedOTP;
    user.emailVerificationTokenExpires = otpExpiry;
    await user.save({ validateBeforeSave: false });

    // Send verification email with OTP
    try {
      await sendVerificationEmail(email, otp);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send verification email. Please try again later.'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Verification code sent successfully. Please check your email.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while resending verification code.'
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({ 
        status: 'fail',
        message: 'Please provide email and password.' 
      });
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'User not found. Please sign up first.'
      });
    }

    // Check if password is correct
    const isPasswordCorrect = await user.comparePassword(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect password. Please try again.'
      });
    }

    // 3) Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        status: 'fail',
        message: 'Email not verified. Please verify your email before logging in.',
        requiresVerification: true,
        email: user.email
      });
    }

    // 4) If everything ok, send token to client
    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong during login.',
      error: error.message
    });
  }
};
