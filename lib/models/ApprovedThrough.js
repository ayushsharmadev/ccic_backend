import mongoose from "mongoose";

const approvedThroughSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Approval authority name is required"],
      trim: true,
      maxlength: [100, "Approval authority name cannot exceed 100 characters"],
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
approvedThroughSchema.index({ name: "text" });
approvedThroughSchema.index({ status: 1 });

export default mongoose.models.ApprovedThrough ||
  mongoose.model("ApprovedThrough", approvedThroughSchema);
