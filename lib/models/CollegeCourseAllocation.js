import mongoose from "mongoose";

const feePeriodSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, "Fee period label is required"],
      trim: true,
      maxlength: [50, "Fee period label cannot exceed 50 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Fee amount is required"],
      min: [0, "Fee amount cannot be negative"],
    },
  },
  { _id: false }
);

const SESSION_REGEX = /^\d{4}-\d{4}$/;

const feeStructureSchema = new mongoose.Schema(
  {
    session: {
      type: String,
      required: [true, "Session is required"],
      trim: true,
      maxlength: [30, "Session cannot exceed 30 characters"],
      validate: {
        validator: function (value) {
          return SESSION_REGEX.test(value);
        },
        message: "Session must be in YYYY-YYYY format",
      },
    },
    structureType: {
      type: String,
      enum: ["annual", "semester"],
      default: "annual",
      required: [true, "Structure type is required"],
    },
    seats: {
      type: Number,
      min: [0, "Seats cannot be negative"],
    },
    periods: {
      type: [feePeriodSchema],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "Fee structure must include at least one fee period",
      },
    },
  },
  { _id: false }
);

const assignedCourseSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },
    courseDuration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseDuration",
      required: [true, "Course duration is required"],
    },
    examType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamType",
    },
    feeStructures: {
      type: [feeStructureSchema],
      default: [],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one session fee structure is required",
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const collegeCourseAllocationSchema = new mongoose.Schema(
  {
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: [true, "College is required"],
      unique: true,
    },
    assignedCourses: {
      type: [assignedCourseSchema],
      default: [],
      validate: {
        validator: function (value) {
          const courseIds = value.map((item) => item.course?.toString());
          return courseIds.length === new Set(courseIds).size;
        },
        message: "Duplicate courses are not allowed in the assignment list",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

collegeCourseAllocationSchema.index({ "assignedCourses.course": 1 });

export default mongoose.models.CollegeCourseAllocation ||
  mongoose.model("CollegeCourseAllocation", collegeCourseAllocationSchema);

