import mongoose from "mongoose";

const countrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Country name is required"],
      trim: true,
      maxlength: [100, "Country name cannot exceed 100 characters"],
      unique: true,
    },
    code: {
      type: String,
      required: [true, "Country code is required"],
      trim: true,
      maxlength: [3, "Country code cannot exceed 3 characters"],
      uppercase: true,
      unique: true,
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

countrySchema.index({ name: "text" });
countrySchema.index({ status: 1 });

export default mongoose.models.Country ||
  mongoose.model("Country", countrySchema);
