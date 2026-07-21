import mongoose from "mongoose";

// CRITICAL: This model MUST use ObjectId references for examType and examLevel
// NOT string enums. Server restart required after this change.
const examSchema = new mongoose.Schema(
  {
    // Basic Information - exact match with frontend
    stream: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stream",
      required: [true, "Stream is required"],
    },
    courseName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    examType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamType",
      required: [true, "Exam type is required"],
    },
    title: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
      maxlength: [200, "Exam title cannot exceed 200 characters"],
    },
    displayRank: {
      type: Number,
      default: 0,
    },
    noOfApplication: {
      type: Number,
      min: [0, "Number of applications cannot be negative"],
    },
    purpose: {
      type: String,
      trim: true,
      maxlength: [500, "Purpose cannot exceed 500 characters"],
    },
    applicationFee: {
      type: Number,
      default: null,
      min: [0, "Application fee cannot be negative"],
    },
    applicationFeeCurrency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Currency",
      default: null,
      validate: {
        validator: function (value) {
          return !(this.applicationFee > 0) || Boolean(value);
        },
        message: "Application fee currency is required when application fee is greater than zero",
      },
    },
    examLevel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamLevel",
      required: [true, "Exam level is required"],
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
      default: null,
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: [true, "Country is required"],
    },

    // Important Dates - exact match with frontend
    applicationDate: {
      type: Date,
    },
    examDate: {
      type: Date,
    },
    resultDate: {
      type: Date,
    },

    // Rich Content - exact match with frontend
    examDescription: {
      type: String,
      trim: true,
    },
    eligibilityCriteria: {
      type: String,
      trim: true,
    },
    applicationProcess: {
      type: String,
      trim: true,
    },
    examPattern: {
      type: String,
      trim: true,
    },
    importantDates: {
      type: String,
      trim: true,
    },
    admitCardDetails: {
      type: String,
      trim: true,
    },
    resultInformation: {
      type: String,
      trim: true,
    },

    // Media & Documents - exact match with frontend
    logo: {
      type: String,
      trim: true,
    },
    pdf: {
      type: String,
      trim: true,
    },

    // Status and Metadata
    status: {
      type: String,
      enum: ["active", "inactive", "draft", "upcoming"],
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
examSchema.index({ title: "text" });
examSchema.index({ stream: 1 });
examSchema.index({ examType: 1 });
examSchema.index({ examLevel: 1 });
examSchema.index({ country: 1 });
examSchema.index({ state: 1 });
examSchema.index({ status: 1 });
examSchema.index({ examDate: 1 });
examSchema.index({ isFeatured: 1 });
examSchema.index({ displayOrder: 1 });

// Pre-save middleware to generate unique slug from title
examSchema.pre("save", async function (next) {
  if (this.isModified("title") && !this.slug) {
    let baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");

    let slug = baseSlug;
    let counter = 1;

    // Check for uniqueness and add counter if needed
    while (true) {
      const existingExam = await this.constructor.findOne({ slug });
      if (
        !existingExam ||
        existingExam._id.toString() === this._id.toString()
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

export default mongoose.models.Exam || mongoose.model("Exam", examSchema);
