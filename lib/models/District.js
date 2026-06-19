import mongoose from "mongoose";

const districtSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "District name is required"],
      trim: true,
      maxlength: [100, "District name cannot exceed 100 characters"],
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
      required: [true, "State is required"],
    },
    code: {
      type: String,
      trim: true,
      maxlength: [10, "District code cannot exceed 10 characters"],
    },
    logo: {
      type: String,
      trim: true,
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
districtSchema.index({ name: "text" });
districtSchema.index({ state: 1 });
districtSchema.index({ status: 1 });

// Compound index for unique district names within a state
districtSchema.index({ name: 1, state: 1 }, { unique: true });

export default mongoose.models.District ||
  mongoose.model("District", districtSchema);
