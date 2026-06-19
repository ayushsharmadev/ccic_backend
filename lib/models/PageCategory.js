import mongoose from "mongoose";

const pageCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
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
  }
);

// Generate slug from name before saving
pageCategorySchema.pre("save", async function (next) {
  if (this.isModified("name") && !this.slug) {
    let baseSlug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    let slug = baseSlug;
    let counter = 1;

    // Check if slug exists
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  }
  next();
});

const PageCategory =
  mongoose.models.PageCategory ||
  mongoose.model("PageCategory", pageCategorySchema);

export default PageCategory;

