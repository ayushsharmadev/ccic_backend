import mongoose from "mongoose";

const examTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Exam type name is required"],
      trim: true,
      maxlength: [200, "Exam type name cannot exceed 200 characters"],
      unique: true,
    },
    shortName: {
      type: String,
      required: [true, "Short name is required"],
      trim: true,
      maxlength: [20, "Short name cannot exceed 20 characters"],
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
examTypeSchema.index({ name: "text", shortName: "text" });
examTypeSchema.index({ status: 1 });

export default mongoose.models.ExamType ||
  mongoose.model("ExamType", examTypeSchema);
