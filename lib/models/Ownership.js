import mongoose from "mongoose";

const ownershipSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Ownership type name is required"],
      trim: true,
      maxlength: [100, "Ownership type name cannot exceed 100 characters"],
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
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
ownershipSchema.index({ name: "text" });
ownershipSchema.index({ status: 1 });

export default mongoose.models.Ownership ||
  mongoose.model("Ownership", ownershipSchema);
