import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import Employee from "../models/employeeModel.js";
import mongoose from "mongoose";
import { randomBytes } from 'crypto';

// Helper function to generate JWT token
const generateToken = (user, employeeID) => {
  return jwt.sign(
    { 
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      role: user.role,
      email: user.email,
      employeeID: employeeID
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Find user by username or email
const findUserByUsernameOrEmail = async (login) => {
  try {
    return await User.findOne({
      $or: [
        { username: login },
        { email: login.toLowerCase() }
      ]
    });
  } catch (error) {
    throw error;
  }
};

// Register a new user
const registerUser = async (req, res) => {
  const { username, password, email, firstName, lastName, employeeId } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: userExists.username === username ? 
          `Username '${username}' is already taken` : 
          `Email '${email}' is already registered`
      });
    }

    // Find employee and check if they can have a user account
    const employee = await Employee.findOne({ employeeID: employeeId });
    
    if (!employee) {
      return res.status(400).json({ 
        success: false,
        message: `Invalid employee ID: ${employeeId}`
      });
    }

    if (employee.hasUser) {
      return res.status(400).json({ 
        success: false,
        message: "This employee already has a user account"
      });
    }

    // Create user with reference to employee
    const user = await User.create({
      username,
      password,
      email,
      firstName,
      lastName,
      employeeId: employee._id,
      role: employee.role
    });

    // Update employee hasUser status
    employee.hasUser = true;
    await employee.save();

    res.status(201).json({
      success: true,
      message: `User account created successfully for ${firstName} ${lastName} (${email})`
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: "Registration failed. Please try again later."
    });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { login, password } = req.body;

  try {
    console.log('Login attempt for:', login);
    const user = await findUserByUsernameOrEmail(login);
    
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: "Invalid username/email or password" });
    }

    console.log('User found:', user.username);
    const isValidPassword = await user.comparePassword(password);
    console.log('Password valid:', isValidPassword);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid username/email or password" });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Populate employee details to get employeeID
    await user.populate('employeeId');
    const employeeID = user.employeeId.employeeID;

    const token = generateToken(user, employeeID);

    res.json({
      token,
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      employeeID
    });
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Login failed: ${error.message}`
      : "Login failed";
    res.status(500).json({ message: errorMessage });
  }
};

// Get available employees for registration
const getAvailableEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ hasUser: false });
    res.json(employees);
  } catch (error) {
    console.error('Error fetching available employees:', error);
    res.status(500).json({ message: "Failed to fetch available employees" });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.'
      });
    }

    // Generate a password reset token using built-in crypto
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour

    // Save the reset token and expiry to the user document
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // In a production environment, you would send an email here
    // For now, we'll just return the token in the response
    return res.status(200).json({
      success: true,
      message: 'Password reset instructions have been sent to your email.',
      resetToken // In production, remove this and send via email instead
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request.'
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find user with valid reset token and token not expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.'
      });
    }

    // Set the new password and clear reset token fields
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password.'
    });
  }
};

export {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getAvailableEmployees
};
