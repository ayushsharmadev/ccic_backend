import mongoose from "mongoose";

const pageSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Section title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Section content is required"],
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: true,
    timestamps: false,
  }
);

const pageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Page title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      required: [true, "Page slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PageCategory",
      default: null,
    },
    heading: {
      type: String,
      trim: true,
      maxlength: [300, "Heading cannot exceed 300 characters"],
    },
    coverImage: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    videoId: {
      type: String,
      trim: true,
    },
    videoType: {
      type: String,
      enum: ["youtube", "vimeo", "other"],
      default: "youtube",
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, "Short description cannot exceed 500 characters"],
    },
    longDescription: {
      type: String,
      trim: true,
    },
    sections: [pageSectionSchema],
    status: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "draft",
    },
    displayOrder: {
      type: Number,
      default: 0,
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
    metaKeywords: {
      type: String,
      trim: true,
    },
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
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
pageSchema.index({ status: 1, displayOrder: 1 });

// Pre-save middleware to generate unique slug from title
pageSchema.pre("save", async function (next) {
  if (this.isModified("title") && !this.slug) {
    let baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");

    let slug = baseSlug;
    let counter = 1;

    // Check for uniqueness and add counter if needed
    while (true) {
      const existingPage = await this.constructor.findOne({ slug });
      if (
        !existingPage ||
        existingPage._id.toString() === this._id.toString()
      ) {
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  }
  next();
});

// Extract video ID from URL
pageSchema.pre("save", function (next) {
  if (this.isModified("videoUrl") && this.videoUrl) {
    const url = this.videoUrl;

    // YouTube patterns
    const youtubePatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    ];

    // Vimeo pattern
    const vimeoPattern = /vimeo\.com\/(\d+)/;

    let videoId = null;
    let videoType = "other";

    // Check YouTube
    for (const pattern of youtubePatterns) {
      const match = url.match(pattern);
      if (match) {
        videoId = match[1];
        videoType = "youtube";
        break;
      }
    }

    // Check Vimeo if not YouTube
    if (!videoId) {
      const vimeoMatch = url.match(vimeoPattern);
      if (vimeoMatch) {
        videoId = vimeoMatch[1];
        videoType = "vimeo";
      }
    }

    this.videoId = videoId;
    this.videoType = videoType;
  }
  next();
});

export default mongoose.models.Page || mongoose.model("Page", pageSchema);

