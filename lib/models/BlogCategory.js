import mongoose from "mongoose";

const blogCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
      maxlength: [50, "Category name cannot exceed 50 characters"],
    },

    slug: {
      type: String,
      required: [true, "Category slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },

    color: {
      type: String,
      default: "#3b82f6",
      trim: true,
    },

    icon: {
      type: String,
      trim: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
blogCategorySchema.index({ displayOrder: 1 });

const BlogCategory =
  mongoose.models.BlogCategory ||
  mongoose.model("BlogCategory", blogCategorySchema);

export default BlogCategory;

