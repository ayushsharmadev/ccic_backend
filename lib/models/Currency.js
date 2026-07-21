import mongoose from "mongoose";

const currencySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Currency name is required"],
      trim: true,
      maxlength: [100, "Currency name cannot exceed 100 characters"],
      unique: true,
    },
    code: {
      type: String,
      required: [true, "Currency code is required"],
      trim: true,
      uppercase: true,
      minlength: [3, "Currency code must be 3 characters"],
      maxlength: [3, "Currency code must be 3 characters"],
      match: [/^[A-Z]{3}$/, "Currency code must be a 3-letter ISO code"],
      unique: true,
    },
    symbol: {
      type: String,
      required: [true, "Currency symbol is required"],
      trim: true,
      maxlength: [10, "Currency symbol cannot exceed 10 characters"],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true,
    },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

currencySchema.index({ status: 1, displayOrder: 1, name: 1 });

export default mongoose.models.Currency || mongoose.model("Currency", currencySchema);
