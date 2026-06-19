import mongoose from "mongoose";

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "News title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    slug: {
      type: String,
      required: [true, "News slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    shortDescription: {
      type: String,
      required: [true, "Short description is required"],
      trim: true,
      maxlength: [300, "Short description cannot exceed 300 characters"],
    },

    content: {
      type: String,
      required: [true, "News content is required"],
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NewsCategory",
      required: [true, "News category is required"],
    },

    featuredImage: {
      type: String,
      default: null,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    isPublished: {
      type: Boolean,
      default: false,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    views: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },

    // SEO Fields
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [60, "Meta title cannot exceed 60 characters"],
    },

    metaDescription: {
      type: String,
      trim: true,
      maxlength: [160, "Meta description cannot exceed 160 characters"],
    },

    metaKeywords: [
      {
        type: String,
        trim: true,
      },
    ],

    focusKeyword: {
      type: String,
      trim: true,
      maxlength: [100, "Focus keyword cannot exceed 100 characters"],
    },

    canonicalUrl: {
      type: String,
      trim: true,
    },

    // Open Graph (Facebook, LinkedIn)
    ogTitle: {
      type: String,
      trim: true,
      maxlength: [60, "OG title cannot exceed 60 characters"],
    },

    ogDescription: {
      type: String,
      trim: true,
      maxlength: [160, "OG description cannot exceed 160 characters"],
    },

    ogImage: {
      type: String,
      trim: true,
    },

    // Twitter Card
    twitterTitle: {
      type: String,
      trim: true,
      maxlength: [60, "Twitter title cannot exceed 60 characters"],
    },

    twitterDescription: {
      type: String,
      trim: true,
      maxlength: [160, "Twitter description cannot exceed 160 characters"],
    },

    twitterImage: {
      type: String,
      trim: true,
    },

    // Structured Data
    schemaMarkup: {
      type: String, // JSON-LD structured data
      trim: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
newsSchema.index({ status: 1, publishedAt: -1 });
newsSchema.index({ category: 1, isPublished: 1 });
newsSchema.index({ isFeatured: 1, publishedAt: -1 });
// Note: slug index not needed here as 'unique: true' on slug field already creates an index

// Pre-save middleware to set publishedAt when status changes to published
newsSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }
  next();
});

// Virtual for formatted published date
newsSchema.virtual("formattedPublishedDate").get(function () {
  if (!this.publishedAt) return null;
  return this.publishedAt.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Virtual for reading time estimation
newsSchema.virtual("readingTime").get(function () {
  if (!this.content) return 0;
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
});

// Ensure virtual fields are included when converting to JSON
newsSchema.set("toJSON", { virtuals: true });
newsSchema.set("toObject", { virtuals: true });

export default mongoose.models.News || mongoose.model("News", newsSchema);
