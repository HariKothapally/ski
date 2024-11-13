import User from "../models/userModel.js";
import mongoose from "mongoose";

export async function findUserByUsername(username) {
  try {
    const user = await User.findOne({ username }); // Use an object to query by username
    return user;
  } catch (error) {
    console.error("Error finding user:", error); // Add error handling
    throw error; // Re-throw the error to be handled by the calling function
  }
}

// Register a new user
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await findUserByUsername(username); // Check if username already exists

    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      username,
      email,
      password,
    });
    const result = await user.save();
    res
      .status(201)
      .json({
        message:
          "Username " +
          username +
          " email " +
          email +
          " " +
          "Successfully registered",
      });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
