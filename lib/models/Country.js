import mongoose from "mongoose";

const countrySchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, "Country name is required"],
      trim: true,
      maxlength: [100, "Country name cannot exceed 100 characters"],
      unique: true,
    },
    shortName: {
      type: String,
      trim: true,
      maxlength: [50, "Short name cannot exceed 50 characters"],
    },
    code: {
      type: String,
      required: [true, "Country code is required"],
      trim: true,
      maxlength: [3, "Country code cannot exceed 3 characters"],
      uppercase: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    
    // Geographical & Basic Facts
    capital: { type: String, trim: true },
    currency: { type: String, trim: true },
    language: { type: String, trim: true },
    population: { type: String, trim: true },
    timeZone: { type: String, trim: true },
    callingCode: { type: String, trim: true },

    // Financials & Study Metrics
    studyMetrics: {
      tuitionFeeMin: { type: Number, default: 0 },
      tuitionFeeMax: { type: Number, default: 0 },
      livingCostMin: { type: Number, default: 0 },
      livingCostMax: { type: Number, default: 0 },
      courseDuration: { type: String, trim: true },
      mediumOfTeaching: { type: String, trim: true },
    },

    admissionDetails: {
      timeline: { type: String, trim: true },
      eligibility: { type: String, trim: true },
      visaType: { type: String, trim: true },
    },

    studyPathways: [{
      title: { type: String, trim: true },
      duration: { type: String, trim: true },
      description: { type: String, trim: true }
    }],

    // Media & Documents
    logo: {
      type: String,
      trim: true,
    },
    banner: {
      type: String,
      trim: true,
    },
    brochure: {
      type: String,
      default: null,
    },
    
    // Galleries
    countryGallery: [
      {
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["image", "video"],
          default: "image",
        },
      },
    ],

    // Description
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [1500, "Short description cannot exceed 1500 characters"],
    },
    longDescription: {
      type: String,
      trim: true,
    },

    // Status and Metadata
    status: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "active",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPopular: {
      type: Boolean,
      default: false,
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

    // Open Graph
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
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
countrySchema.index(
  { name: "text", shortName: "text" },
  { language_override: "dummy_language_field" }
);
countrySchema.index({ status: 1 });
countrySchema.index({ isFeatured: 1 });
countrySchema.index({ isPopular: 1 });
countrySchema.index({ displayOrder: 1 });
countrySchema.index({ status: 1, isFeatured: 1, displayOrder: 1 });

// Pre-save middleware to generate slug
countrySchema.pre("save", async function (next) {
  if ((this.isModified("name") || this.isNew) && !this.slug) {
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");

    let slug = baseSlug;
    let counter = 1;

    // Check for uniqueness
    while (true) {
      const existingCountry = await this.constructor.findOne({ slug });
      if (
        !existingCountry ||
        existingCountry._id.toString() === this._id.toString()
      ) {
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  }
  
  if (!this.shortName && this.name) {
      this.shortName = this.name;
  }

  next();
});

export default mongoose.models.Country ||
  mongoose.model("Country", countrySchema);
