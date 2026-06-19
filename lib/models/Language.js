import mongoose from "mongoose";

const languageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Language name is required"],
      trim: true,
      maxlength: [200, "Language name cannot exceed 200 characters"],
      unique: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, "Short description cannot exceed 500 characters"],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
languageSchema.index({ name: "text" });
languageSchema.index({ status: 1 });

export default mongoose.models.Language || mongoose.model("Language", languageSchema);

