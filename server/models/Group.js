import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    invitations: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true },
        mobile: { type: String },
        status: { type: String, enum: ["pending", "accepted"], default: "pending" }
      }
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);

export default Group;