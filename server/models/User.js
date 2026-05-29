import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      }
    },

    authProvider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local"
    },

    providerId: {
      type: String
    },

    avatar: {
      type: String
    },

    phone: {
      type: String
    },

    currency: {
      type: String,
      default: "INR"
    },

    bio: {
      type: String
    },

    resetOTP: {
      type: String
    },

    resetOTPExpires: {
      type: Date
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
