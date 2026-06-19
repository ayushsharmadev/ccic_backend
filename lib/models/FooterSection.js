import mongoose from "mongoose";

const footerLinkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Link title is required"],
      trim: true,
      maxlength: [200, "Link title cannot exceed 200 characters"],
    },
    url: {
      type: String,
      required: [true, "Link URL is required"],
      trim: true,
      maxlength: [500, "Link URL cannot exceed 500 characters"],
    },
    openInNewTab: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const footerSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Section title is required"],
      trim: true,
      maxlength: [200, "Section title cannot exceed 200 characters"],
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    links: {
      type: [footerLinkSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sectionType: {
      type: String,
      enum: ["links", "newsletter", "company_info", "social_media"],
      default: "links",
    },
    showArrowIcon: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
footerSectionSchema.index({ isActive: 1, displayOrder: 1 });

// Delete the model from cache if it exists to ensure fresh schema
if (mongoose.models.FooterSection) {
  delete mongoose.models.FooterSection;
}

export default mongoose.model("FooterSection", footerSectionSchema);

