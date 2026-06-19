import mongoose from "mongoose";

const courseDurationSchema = new mongoose.Schema(
  {
    value: {
      type: Number,
      required: [true, "Course duration value is required"],
      min: [0, "Course duration cannot be negative"],
    },
    unit: {
      type: String,
      required: [true, "Course duration unit is required"],
      enum: ["years", "months"],
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: [50, "Course duration name cannot exceed 50 characters"],
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

courseDurationSchema.pre("validate", function (next) {
  if (this.value !== undefined && this.value !== null) {
    const numericValue = Number(this.value);
    if (Number.isNaN(numericValue)) {
      this.invalidate("value", "Course duration value must be a valid number");
    } else {
      this.value = numericValue;
    }
  }

  if (this.value === undefined || this.value === null) {
    this.invalidate("value", "Course duration value is required");
  }

  if (!this.unit) {
    this.invalidate("unit", "Course duration unit is required");
  }

  if (this.value !== undefined && this.unit) {
    const unitLabel =
      this.unit === "years"
        ? this.value === 1
          ? "Year"
          : "Years"
        : this.value === 1
          ? "Month"
          : "Months";
    this.name = `${this.value} ${unitLabel}`;
  }

  next();
});

courseDurationSchema.virtual("displayLabel").get(function () {
  return this.name;
});

courseDurationSchema.pre("save", function (next) {
  if (!this.name && this.value !== undefined && this.unit) {
    const unitLabel =
      this.unit === "years"
        ? this.value === 1
          ? "Year"
          : "Years"
        : this.value === 1
          ? "Month"
          : "Months";
    this.name = `${this.value} ${unitLabel}`;
  }
  next();
});

// Indexes for better query performance
courseDurationSchema.index({ name: "text" });
courseDurationSchema.index({ status: 1 });
courseDurationSchema.index({ value: 1, unit: 1 }, { unique: true });

export default mongoose.models.CourseDuration ||
  mongoose.model("CourseDuration", courseDurationSchema);
