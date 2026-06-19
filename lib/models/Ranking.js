import mongoose from "mongoose";

const rankingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Ranking name is required"],
      trim: true,
      maxlength: [200, "Ranking name cannot exceed 200 characters"],
      unique: true,
    },
    rankValue: {
      type: String,
      required: [true, "Rank value is required"],
      trim: true,
      maxlength: [20, "Rank value cannot exceed 20 characters"],
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
rankingSchema.index({ name: "text" });
rankingSchema.index({ rankValue: 1 });
rankingSchema.index({ status: 1 });

export default mongoose.models.Ranking ||
  mongoose.model("Ranking", rankingSchema);
