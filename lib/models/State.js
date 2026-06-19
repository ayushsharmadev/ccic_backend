import mongoose from "mongoose";

const stateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "State name is required"],
      trim: true,
      maxlength: [100, "State name cannot exceed 100 characters"],
    },
    code: {
      type: String,
      required: [true, "State code is required"],
      trim: true,
      maxlength: [10, "State code cannot exceed 10 characters"],
      uppercase: true,
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: [true, "Country is required"],
    },
    logo: {
      type: String,
      trim: true,
    },
    map: {
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

stateSchema.index({ name: "text" });
stateSchema.index({ country: 1 });
stateSchema.index({ status: 1 });
stateSchema.index({ name: 1, country: 1 }, { unique: true });
stateSchema.index({ code: 1, country: 1 }, { unique: true });

export default mongoose.models.State || mongoose.model("State", stateSchema);
