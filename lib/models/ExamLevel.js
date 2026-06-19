import mongoose from "mongoose";

const examLevelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Exam level name is required"],
      trim: true,
      unique: true,
      maxlength: [50, "Exam level name cannot exceed 50 characters"],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
examLevelSchema.index({ status: 1 });

const ExamLevel =
  mongoose.models.ExamLevel || mongoose.model("ExamLevel", examLevelSchema);

export default ExamLevel;
