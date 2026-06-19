import mongoose from "mongoose";

const degreeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Degree name is required"],
      trim: true,
      maxlength: [200, "Degree name cannot exceed 200 characters"],
      unique: true,
    },
    shortName: {
      type: String,
      trim: true,
      maxlength: [20, "Short name cannot exceed 20 characters"],
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
degreeSchema.index({ name: "text" });
degreeSchema.index({ shortName: 1 });
degreeSchema.index({ status: 1 });

export default mongoose.models.Degree || mongoose.model("Degree", degreeSchema);
