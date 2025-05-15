import crypto from 'crypto';

/**
 * Generate a random OTP (One-Time Password)
 * @param {number} length - Length of the OTP (default: 6)
 * @returns {string} - Generated OTP
 */
export const generateOTP = (length = 6) => {
  // Generate a random 6-digit number
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

/**
 * Generate a secure token for email verification or password reset
 * @returns {string} - Generated token
 */
export const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a token for secure storage
 * @param {string} token - Token to hash
 * @returns {string} - Hashed token
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export default {
  generateOTP,
  generateToken,
  hashToken,
};
