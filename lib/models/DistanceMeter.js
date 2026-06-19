import mongoose from "mongoose";

const distanceMeterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Distance meter name is required"],
      trim: true,
      maxlength: [200, "Distance meter name cannot exceed 200 characters"],
      unique: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, "Short description cannot exceed 500 characters"],
    },
    icon: {
      type: String,
      trim: true,
      maxlength: [500, "Icon cannot exceed 500 characters"],
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
distanceMeterSchema.index({ name: "text" });
distanceMeterSchema.index({ status: 1 });

export default mongoose.models.DistanceMeter ||
  mongoose.model("DistanceMeter", distanceMeterSchema);

