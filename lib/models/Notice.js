import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Notice title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      required: false,
      trim: true,
      maxlength: [500, "Link cannot exceed 500 characters"],
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      default: null,
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

// Indexes for better query performance
noticeSchema.index({ college: 1, displayOrder: 1 });
noticeSchema.index({ status: 1, displayOrder: 1 });
noticeSchema.index({ college: 1, status: 1, displayOrder: 1 });

export default mongoose.models.Notice ||
  mongoose.model("Notice", noticeSchema);

