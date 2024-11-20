import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    description: "Username must be unique"
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    description: "User's first name"
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    description: "User's last name"
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    description: "User's email address"
  },
  password: {
    type: String,
    required: true,
    description: "User's password (hashed)"
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    description: "Reference to associated employee"
  },
  role: {
    type: String,
    enum: ['admin', 'staff'],
    default: 'staff',
    description: "User role for authorization"
  },
  lastLogin: {
    type: Date,
    description: "Last login timestamp"
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

const User = mongoose.model("User", userSchema);

export default User;
