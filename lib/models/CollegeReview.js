import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Reply name is required"],
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
      maxlength: [15, "Mobile cannot exceed 15 characters"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [100, "Email cannot exceed 100 characters"],
      validate: {
        validator: function (v) {
          if (!v) return true; // Optional field
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Please enter a valid email address",
      },
    },
    comment: {
      type: String,
      required: [true, "Reply comment is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { _id: false, timestamps: true }
);

const collegeReviewSchema = new mongoose.Schema(
  {
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: [true, "College is required"],
    },
    name: {
      type: String,
      required: [true, "Reviewer name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    mobile: {
      type: String,
      trim: true,
      maxlength: [15, "Mobile cannot exceed 15 characters"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [100, "Email cannot exceed 100 characters"],
      validate: {
        validator: function (v) {
          if (!v) return true; // Optional field
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Please enter a valid email address",
      },
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    replies: {
      type: [replySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
collegeReviewSchema.index({ college: 1 });
collegeReviewSchema.index({ status: 1 });
collegeReviewSchema.index({ rating: 1 });
collegeReviewSchema.index({ college: 1, status: 1 });
collegeReviewSchema.index({ createdAt: -1 });

export default mongoose.models.CollegeReview ||
  mongoose.model("CollegeReview", collegeReviewSchema);

