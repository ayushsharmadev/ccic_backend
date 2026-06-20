import mongoose from "mongoose";

const countrySectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Section title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    tabName: {
      type: String,
      required: [true, "Tab name is required"],
      trim: true,
      maxlength: [120, "Tab name cannot exceed 120 characters"],
      default: function () {
        return this.title;
      },
    },
    slug: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: [true, "Section content is required"],
      trim: true,
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: [true, "Country is required"],
    },
    displayOrder: {
      type: Number,
      default: 0,
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
countrySectionSchema.index({ country: 1, displayOrder: 1 });
countrySectionSchema.index({ country: 1, status: 1, displayOrder: 1 });
countrySectionSchema.index({ country: 1, slug: 1 }, { unique: true });

// Pre-save middleware to generate unique slug within country
countrySectionSchema.pre("save", async function (next) {
  if ((this.isModified("title") || this.isNew) && !this.slug) {
    let baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");

    let slug = baseSlug;
    let counter = 1;

    // Check for uniqueness within the same country
    while (true) {
      const existingSection = await this.constructor.findOne({
        country: this.country,
        slug: slug,
      });

      if (
        !existingSection ||
        existingSection._id.toString() === this._id.toString()
      ) {
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  }
  next();
});

export default mongoose.models.CountrySection ||
  mongoose.model("CountrySection", countrySectionSchema);
