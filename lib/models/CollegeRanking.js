import mongoose from "mongoose";

const yearRankingSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [2000, "Year must be at least 2000"],
      max: [2100, "Year cannot exceed 2100"],
    },
    rank: {
      type: Number,
      required: [true, "Rank is required"],
      min: [1, "Rank must be at least 1"],
    },
    outOf: {
      type: Number,
      required: [true, "Out of value is required"],
      min: [1, "Out of value must be at least 1"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  { _id: false }
);

const collegeRankingItemSchema = new mongoose.Schema(
  {
    ranking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ranking",
      required: [true, "Ranking is required"],
    },
    yearRankings: {
      type: [yearRankingSchema],
      default: [],
      validate: {
        validator: function (value) {
          // Check for duplicate years within same ranking
          const years = value.map((item) => item.year);
          return years.length === new Set(years).size;
        },
        message: "Duplicate years are not allowed for the same ranking",
      },
    },
  },
  { _id: false }
);

const collegeRankingSchema = new mongoose.Schema(
  {
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: [true, "College is required"],
      unique: true,
    },
    rankings: {
      type: [collegeRankingItemSchema],
      default: [],
      validate: {
        validator: function (value) {
          // Check for duplicate rankings
          const rankingIds = value.map((item) => item.ranking?.toString());
          return rankingIds.length === new Set(rankingIds).size;
        },
        message: "Duplicate rankings are not allowed for the same college",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

collegeRankingSchema.index({ "rankings.ranking": 1 });
collegeRankingSchema.index({ "rankings.yearRankings.year": 1 });

export default mongoose.models.CollegeRanking ||
  mongoose.model("CollegeRanking", collegeRankingSchema);

