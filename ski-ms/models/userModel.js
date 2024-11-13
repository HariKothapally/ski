import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    description: "must be an objectId and is required",
  },
  username: {
    type: String,
    required: true,
    unique: true,
    description: "must be a string and is required",
  },
  email: {
    type: String,
    required: true,
    unique: true,
    description: "must be a string and is required",
  },
  password: {
    type: String,
    required: true,
    description: "must be a string and is required",
  },
});

// Hash password before saving the user
userSchema.pre("save", async function (next) {
  if (this.isModified("password") || this.isNew) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
