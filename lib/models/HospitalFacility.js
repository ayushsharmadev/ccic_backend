import mongoose from "mongoose";

const hospitalFacilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Facility name is required"],
      trim: true,
      maxlength: [100, "Facility name cannot exceed 100 characters"],
      unique: true,
    },
    image: {
      type: String,
      trim: true,
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
hospitalFacilitySchema.index({ name: "text" });
hospitalFacilitySchema.index({ status: 1 });

export default mongoose.models.HospitalFacility ||
  mongoose.model("HospitalFacility", hospitalFacilitySchema);
