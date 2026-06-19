import mongoose from "mongoose";

const newsCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
      maxlength: [50, "Category name cannot exceed 50 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },

    color: {
      type: String,
      default: "#6B7280", // Default gray color
      validate: {
        validator: function (v) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: "Color must be a valid hex color code",
      },
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
newsCategorySchema.index({ isActive: 1, displayOrder: 1 });

// Pre-save middleware to generate slug from name
newsCategorySchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  }
  next();
});

// Ensure virtual fields are included when converting to JSON
newsCategorySchema.set("toJSON", { virtuals: true });
newsCategorySchema.set("toObject", { virtuals: true });

export default mongoose.models.NewsCategory ||
  mongoose.model("NewsCategory", newsCategorySchema);
