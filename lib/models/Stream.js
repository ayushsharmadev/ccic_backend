import mongoose from "mongoose";

const streamSchema = new mongoose.Schema(
  {
    // Basic Information - exact match with frontend
    name: {
      type: String,
      required: [true, "Stream name is required"],
      trim: true,
      maxlength: [100, "Stream name cannot exceed 100 characters"],
      unique: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    about: {
      type: String,
      required: [true, "Stream description is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Draft"],
      default: "Active",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
streamSchema.index({ name: "text" });
streamSchema.index({ status: 1 });

export default mongoose.models.Stream || mongoose.model("Stream", streamSchema);
