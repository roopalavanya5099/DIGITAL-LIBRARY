import mongoose from "mongoose";

const approvedRollNumberSchema = new mongoose.Schema(
  {
    rollNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ApprovedRollNumber", approvedRollNumberSchema);