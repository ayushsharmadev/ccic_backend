import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    // Student Details (unified field names)
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
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
      required: [true, "Email address is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Please enter a valid email address",
      },
    },

    // Additional Details
    city: {
      type: String,
      trim: true,
      default: "",
    },
    neetScore: {
      type: String,
      trim: true,
      default: "",
    },
    course: {
      type: String,
      trim: true,
      default: "MBBS",
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },

    // College Preferences
    preferredColleges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "College",
      },
    ],

    // Metadata
    source: {
      type: String,
      enum: ["home_page", "contact_page", "college_page", "sidebar", "modal", "other"],
      default: "other",
    },
    formType: {
      type: String,
      enum: ["mbbs_admission", "apply_enquiry", "quick_enquiry", "contact"],
      default: "contact",
    },

    // Admin Management
    status: {
      type: String,
      enum: ["new", "contacted", "interested", "not_interested", "converted", "spam"],
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
contactSchema.index({ createdAt: -1 });
contactSchema.index({ status: 1 });
contactSchema.index({ phone: 1 });
contactSchema.index({ email: 1 });
contactSchema.index({ source: 1 });
contactSchema.index({ formType: 1 });

const Contact =
  mongoose.models.Contact || mongoose.model("Contact", contactSchema);

export default Contact;

