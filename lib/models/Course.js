import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    // Basic Information - exact match with frontend
    streamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stream",
      required: [true, "Stream is required"],
    },
    degreeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Degree",
      required: [true, "Degree is required"],
    },
    name: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
      maxlength: [200, "Course name cannot exceed 200 characters"],
    },
    logo: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    averageFee: {
      type: String,
      trim: true,
      maxlength: [100, "Average fee cannot exceed 100 characters"],
    },

    // Rich Content - exact match with frontend
    description: {
      type: String,
      trim: true,
    },
    admissionProcess: {
      type: String,
      trim: true,
    },
    eligibilityCriteria: {
      type: String,
      trim: true,
    },
    entranceExamsDetails: {
      type: String,
      trim: true,
    },
    howToPrepare: {
      type: String,
      trim: true,
    },

    // Status and Metadata
    status: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "active",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
courseSchema.index({ name: "text" });
courseSchema.index({ streamId: 1 });
courseSchema.index({ degreeId: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ isFeatured: 1 });
courseSchema.index({ displayOrder: 1 });

// Pre-save middleware to generate unique slug from name
courseSchema.pre("save", async function (next) {
  if (this.isModified("name") && !this.slug) {
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");

    let slug = baseSlug;
    let counter = 1;

    // Check for uniqueness and add counter if needed
    while (true) {
      const existingCourse = await this.constructor.findOne({ slug });
      if (
        !existingCourse ||
        existingCourse._id.toString() === this._id.toString()
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

export default mongoose.models.Course || mongoose.model("Course", courseSchema);
