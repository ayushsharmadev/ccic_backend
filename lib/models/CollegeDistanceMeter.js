import mongoose from "mongoose";

const collegeDistanceMeterItemSchema = new mongoose.Schema(
  {
    distanceMeter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DistanceMeter",
      required: [true, "Distance meter is required"],
    },
    value: {
      type: Number,
      required: [true, "Distance value is required"],
      min: [0, "Distance value cannot be negative"],
    },
  },
  { _id: false }
);

const collegeDistanceMeterSchema = new mongoose.Schema(
  {
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: [true, "College is required"],
      unique: true,
    },
    distanceMeters: {
      type: [collegeDistanceMeterItemSchema],
      default: [],
      validate: {
        validator: function (value) {
          const distanceMeterIds = value.map((item) =>
            item.distanceMeter?.toString()
          );
          return distanceMeterIds.length === new Set(distanceMeterIds).size;
        },
        message: "Duplicate distance meters are not allowed for the same college",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

collegeDistanceMeterSchema.index({ "distanceMeters.distanceMeter": 1 });

export default mongoose.models.CollegeDistanceMeter ||
  mongoose.model("CollegeDistanceMeter", collegeDistanceMeterSchema);

