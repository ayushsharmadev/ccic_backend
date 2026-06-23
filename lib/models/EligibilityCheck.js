import mongoose from "mongoose";

const eligibilityCheckSchema = new mongoose.Schema(
  {
    // Student Details
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^[6-9]\d{9}$/.test(v);
        },
        message: "Please enter a valid 10-digit mobile number",
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // Course Information
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },

    // NEET Score Information (Deprecated)
    neetScore: {
      type: Number,
      min: [0, "NEET score cannot be negative"],
      max: [720, "NEET score cannot exceed 720"],
    },

    // Category Information (Deprecated)
    category: {
      type: String,
      enum: [
        "UR/EWS",
        "OBC",
        "SC",
        "ST",
        "UR/EWS - PwBD",
        "OBC PwD",
        "SC PwD",
        "ST PwD",
      ],
    },

    // Academic Information
    tenthPassingYear: {
      type: Number,
      min: [2000, "Passing year must be 2000 or later"],
      validate: {
        validator: function (v) {
          if (v === null || v === undefined) return true; // Optional field
          const currentYear = new Date().getFullYear();
          return v >= 2000 && v <= currentYear;
        },
        message: "Passing year must be between 2000 and current year",
      },
    },
    intermediateMarks: {
      type: Number,
      min: [0, "Marks cannot be negative"],
      max: [100, "Marks cannot exceed 100"],
    },

    // Eligibility Result
    isEligible: {
      type: Boolean,
      default: null, // null until checked by admin
    },
    eligibilityRemarks: {
      type: String,
      trim: true,
      default: "",
    },

    // Admin Management
    status: {
      type: String,
      enum: ["new", "contacted", "eligible", "not_eligible", "pending_review", "converted"],
      default: "new",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Tracking Data
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    referrer: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      default: "eligibility_checker_page",
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
eligibilityCheckSchema.index({ createdAt: -1 });
eligibilityCheckSchema.index({ status: 1 });
eligibilityCheckSchema.index({ mobile: 1 });
eligibilityCheckSchema.index({ isEligible: 1 });
eligibilityCheckSchema.index({ course: 1 });
eligibilityCheckSchema.index({ neetScore: 1 });
eligibilityCheckSchema.index({ category: 1 });

const EligibilityCheck =
  mongoose.models.EligibilityCheck ||
  mongoose.model("EligibilityCheck", eligibilityCheckSchema);

export default EligibilityCheck;

