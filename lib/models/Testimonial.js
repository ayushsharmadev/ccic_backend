import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    designation: {
      type: String,
      required: [true, "Designation is required"],
      trim: true,
      maxlength: [100, "Designation cannot exceed 100 characters"],
    },

    college: {
      type: String,
      required: [true, "College is required"],
      trim: true,
      maxlength: [200, "College name cannot exceed 200 characters"],
    },

    testimonial: {
      type: String,
      required: [true, "Testimonial content is required"],
      trim: true,
      maxlength: [1000, "Testimonial cannot exceed 1000 characters"],
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      default: 5,
    },

    avatar: {
      type: String,
      required: [true, "Avatar initials are required"],
      trim: true,
      maxlength: [10, "Avatar initials cannot exceed 10 characters"],
    },

    image: {
      type: String,
      default: null,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
testimonialSchema.index({ status: 1, publishedAt: -1 });
testimonialSchema.index({ isPublished: 1, isFeatured: 1 });
testimonialSchema.index({ displayOrder: 1 });

// Pre-save middleware to set publishedAt when status changes to published
testimonialSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }
  next();
});

// Virtual for formatted published date
testimonialSchema.virtual("formattedPublishedDate").get(function () {
  if (!this.publishedAt) return null;
  return this.publishedAt.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Ensure virtual fields are included when converting to JSON
testimonialSchema.set("toJSON", { virtuals: true });
testimonialSchema.set("toObject", { virtuals: true });

export default mongoose.models.Testimonial ||
  mongoose.model("Testimonial", testimonialSchema);
