import mongoose from "mongoose";

const affiliationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Affiliation name is required"],
      trim: true,
      maxlength: [100, "Affiliation name cannot exceed 100 characters"],
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
affiliationSchema.index({ name: "text" });
affiliationSchema.index({ status: 1 });

export default mongoose.models.Affiliation ||
  mongoose.model("Affiliation", affiliationSchema);
