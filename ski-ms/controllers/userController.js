import User from "../models/userModel.js";
import Employee from "../models/employeeModel.js";
import mongoose from "mongoose";
import { randomBytes } from 'crypto';
import { generateToken, hashPassword, comparePassword } from '../utils/auth.js';
import { validateEmail, validatePassword, sanitizeInput } from '../utils/validation.js';
import { AppError, catchAsync } from '../utils/errorHandler.js';

const validateUserInput = (data, isUpdate = false) => {
  const { username, password, email, firstName, lastName, employeeId } = data;

  if (!isUpdate) {
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      throw new AppError('Username must be at least 3 characters long', 400);
    }

    if (!password || !validatePassword(password)) {
      throw new AppError('Password must be at least 8 characters long and contain uppercase, lowercase, and numbers', 400);
    }

    if (!email || !validateEmail(email)) {
      throw new AppError('Invalid email format', 400);
    }
  } else {
    if (username && (typeof username !== 'string' || username.trim().length < 3)) {
      throw new AppError('Username must be at least 3 characters long', 400);
    }

    if (password && !validatePassword(password)) {
      throw new AppError('Password must be at least 8 characters long and contain uppercase, lowercase, and numbers', 400);
    }

    if (email && !validateEmail(email)) {
      throw new AppError('Invalid email format', 400);
    }
  }

  if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
    throw new AppError('First name is required', 400);
  }

  if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
    throw new AppError('Last name is required', 400);
  }

  if (!employeeId) {
    throw new AppError('Employee ID is required', 400);
  }

  return {
    ...(username && { username: sanitizeInput(username) }),
    ...(email && { email: email.toLowerCase() }),
    firstName: sanitizeInput(firstName),
    lastName: sanitizeInput(lastName),
    employeeId
  };
};

// Find user by username or email
const findUserByUsernameOrEmail = catchAsync(async (login) => {
  return await User.findOne({
    $or: [
      { username: login },
      { email: login.toLowerCase() }
    ]
  });
});

// Register a new user
export const registerUser = catchAsync(async (req, res) => {
  const validatedData = validateUserInput(req.body);
  const { password } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({
    $or: [
      { username: validatedData.username },
      { email: validatedData.email }
    ]
  });

  if (userExists) {
    throw new AppError(
      userExists.username === validatedData.username ? 
      `Username '${validatedData.username}' is already taken` : 
      `Email '${validatedData.email}' is already registered`,
      400
    );
  }

  // Find employee and check if they can have a user account
  const employee = await Employee.findOne({ employeeID: validatedData.employeeId });
  
  if (!employee) {
    throw new AppError(`Invalid employee ID: ${validatedData.employeeId}`, 400);
  }

  if (employee.hasUser) {
    throw new AppError("This employee already has a user account", 400);
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user with reference to employee
  const user = await User.create({
    ...validatedData,
    password: hashedPassword,
    employeeId: employee._id,
    role: employee.role,
    created_at: new Date()
  });

  // Update employee hasUser status
  employee.hasUser = true;
  await employee.save();

  const token = generateToken(user, employee.employeeID);

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      employeeID: employee.employeeID
    }
  });
});

// Login user
export const loginUser = catchAsync(async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    throw new AppError('Please provide login credentials', 400);
  }

  const user = await findUserByUsernameOrEmail(login);
  
  if (!user) {
    throw new AppError('Invalid login credentials', 401);
  }

  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    throw new AppError('Invalid login credentials', 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Populate employee details to get employeeID
  await user.populate('employeeId');
  const employeeID = user.employeeId.employeeID;

  const token = generateToken(user, employeeID);

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      employeeID
    }
  });
});

// Get available employees for registration
export const getAvailableEmployees = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  // Build filter object
  let filter = { hasUser: false };
  
  if (req.query.search) {
    const searchRegex = new RegExp(sanitizeInput(req.query.search), 'i');
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { employeeID: searchRegex }
    ];
  }

  if (req.query.role) {
    filter.role = sanitizeInput(req.query.role);
  }

  const employees = await Employee.find(filter)
    .sort({ firstName: 1, lastName: 1 })
    .skip(skip)
    .limit(limit)
    .select('-__v');

  const total = await Employee.countDocuments(filter);

  res.json({
    success: true,
    data: {
      employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Forgot password
export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email || !validateEmail(email)) {
    throw new AppError('Please provide a valid email address', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    // For security reasons, we still return success even if user not found
    return res.json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions.'
    });
  }

  // Generate reset token
  const resetToken = randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

  // Save reset token to user
  user.resetToken = resetToken;
  user.resetTokenExpiry = resetTokenExpiry;
  await user.save();

  // In a production environment, you would send an email here
  // For development, we'll just return the token
  res.json({
    success: true,
    message: 'Password reset instructions have been sent.',
    // Only include token in development
    ...(process.env.NODE_ENV === 'development' && { resetToken })
  });
});

// Reset password
export const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new AppError('Please provide reset token and new password', 400);
  }

  if (!validatePassword(password)) {
    throw new AppError('Password must be at least 8 characters long and contain uppercase, lowercase, and numbers', 400);
  }

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() }
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  // Update password and clear reset token
  user.password = await hashPassword(password);
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  user.updated_at = new Date();
  await user.save();

  res.json({
    success: true,
    message: 'Password has been reset successfully'
  });
});
