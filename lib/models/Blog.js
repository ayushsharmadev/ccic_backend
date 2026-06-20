import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    slug: {
      type: String,
      required: [true, "Blog slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    excerpt: {
      type: String,
      required: [true, "Excerpt is required"],
      trim: true,
      maxlength: [300, "Excerpt cannot exceed 300 characters"],
    },

    content: {
      type: String,
      required: [true, "Blog content is required"],
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogCategory",
      required: [true, "Category is required"],
    },

    relatedCountries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Country",
      },
    ],

    featuredImage: {
      type: String,
      default: null,
    },

    isFeatured: {
      type: Boolean,
      default: false,
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

    readTime: {
      type: Number,
      default: 5,
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
blogSchema.index({ status: 1, publishedAt: -1 });
// Note: slug index not needed here as 'unique: true' on slug field already creates an index
blogSchema.index({ category: 1 });
blogSchema.index({ author: 1 });

// Auto-publish when status changes to published
blogSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "published") {
    this.isPublished = true;
    if (!this.publishedAt) {
      this.publishedAt = new Date();
    }
  }
  next();
});

// Virtual for formatted published date
blogSchema.virtual("formattedPublishedDate").get(function () {
  if (!this.publishedAt) return null;
  return this.publishedAt.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Ensure virtual fields are included when converting to JSON
blogSchema.set("toJSON", { virtuals: true });
blogSchema.set("toObject", { virtuals: true });

const Blog = mongoose.models.Blog || mongoose.model("Blog", blogSchema);

export default Blog;

