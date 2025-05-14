import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

// Create a transporter object
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to another service
  auth: {
    user: process.env.EMAIL_USERNAME || 'your-email@gmail.com', // Add this to your .env file
    pass: process.env.EMAIL_PASSWORD || 'your-app-password', // Add this to your .env file
  },
});

/**
 * Send verification email with OTP
 * @param {string} to - Recipient email
 * @param {string} otp - One-time password
 * @returns {Promise} - Nodemailer response
 */
export const sendVerificationEmail = async (to, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USERNAME || 'your-email@gmail.com',
    to,
    subject: 'FinPath Insight - Email Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #2c3e50; text-align: center;">Welcome to FinPath Insight!</h2>
        <p style="color: #333; font-size: 16px;">Thank you for registering. To complete your registration, please use the following verification code:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 4px; margin: 20px 0; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
          ${otp}
        </div>
        
        <p style="color: #333; font-size: 14px;">This code will expire in 10 minutes.</p>
        <p style="color: #333; font-size: 14px;">If you didn't request this verification, please ignore this email.</p>
        
        <div style="margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 12px;">
          <p>© ${new Date().getFullYear()} FinPath Insight. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} resetToken - Password reset token
 * @returns {Promise} - Nodemailer response
 */
export const sendPasswordResetEmail = async (to, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USERNAME || 'your-email@gmail.com',
    to,
    subject: 'FinPath Insight - Password Reset',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #2c3e50; text-align: center;">Password Reset Request</h2>
        <p style="color: #333; font-size: 16px;">You requested a password reset. Please click the button below to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        
        <p style="color: #333; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #333; font-size: 14px;">If you didn't request a password reset, please ignore this email.</p>
        
        <div style="margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 12px;">
          <p>© ${new Date().getFullYear()} FinPath Insight. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
