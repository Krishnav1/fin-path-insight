import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    trim: true,
    // Basic email validation
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8, // Enforce a minimum password length
    select: false, // Do not send back password field by default
  },
  contactNumber: {
    type: String,
    required: [true, 'Please provide your contact number'],
    trim: true,
    // Basic phone number validation (optional, can be more specific)
    match: [/^(\+\d{1,3}[- ]?)?\d{10}$/, 'Please fill a valid contact number'],
  },
  address: {
    street: { type: String, trim: true, required: [true, 'Please provide a street address'] },
    city: { type: String, trim: true, required: [true, 'Please provide a city'] },
    state: { type: String, trim: true, required: [true, 'Please provide a state'] },
    zipCode: { type: String, trim: true, required: [true, 'Please provide a zip code'] },
    country: { type: String, trim: true, required: [true, 'Please provide a country'] },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationTokenExpires: Date,
  googleId: String,
});

// Password hashing middleware: runs before saving a document
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  next();
});

// Instance method to compare candidate password with user's hashed password
userSchema.methods.comparePassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

export default User;
