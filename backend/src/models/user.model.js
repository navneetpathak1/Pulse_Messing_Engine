import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    balance: {
      type: Number,
      default: 45000,
      min: 0,
    },
    passkey: {
      type: String,
      default: "1234",
    }
  },
  { timestamps: true }
);

// Add index for better query performance
userSchema.index({ fullName: 1 });

const User = mongoose.model("User", userSchema);

export default User;