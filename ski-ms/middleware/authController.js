import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import bcrypt from "bcrypt";



// Generate a JWT token
export function generateToken(username) {
  if (!process.env.JWT_SECRET) {
    throw new Error("SECRET_KEY is required to generate token");
  }

  const SECRET_KEY = process.env.JWT_SECRET;
  try {
    return jwt.sign({ username }, SECRET_KEY, { expiresIn: "3h" });
  } catch (error) {
    console.error("Error generating token:", error);
    throw new Error("Token generation failed");
  }
}

// Verify a JWT token
export function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

// Login and generate a token
export async function login(req, res) {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = generateToken(username);

    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// Access protected route
export async function protectedRoute(req, res) {
  const token = req.headers["authorization"];

  if (token) {
    try {
      verifyToken(token);
      res.send("This is a protected route");
    } catch (err) {
      res.status(401).send("Invalid token");
    }
  } else {
    res.status(401).send("Token is required");
  }
}
