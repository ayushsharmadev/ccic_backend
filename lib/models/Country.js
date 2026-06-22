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
      required: [true, "Short name is required"],
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
    capital: { type: String, required: [true, "Capital is required"], trim: true },
    currency: { type: String, required: [true, "Currency is required"], trim: true },
    language: { type: String, required: [true, "Language is required"], trim: true },
    population: { type: String, required: [true, "Population is required"], trim: true },
    timeZone: { type: String, required: [true, "Time zone is required"], trim: true },
    callingCode: { type: String, required: [true, "Calling code is required"], trim: true },

    quickFacts: [{
      label: { type: String, required: [true, "Quick fact label is required"], trim: true },
      value: { type: String, required: [true, "Quick fact value is required"], trim: true }
    }],

    // Media & Documents
    logo: {
      type: String,
      required: [true, "Country logo is required"],
      trim: true,
    },
    banner: {
      type: String,
      required: [true, "Country banner is required"],
      trim: true,
    },
    brochure: {
      type: String,
      required: [true, "Country brochure is required"],
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
      required: [true, "Short description is required"],
      trim: true,
      maxlength: [1500, "Short description cannot exceed 1500 characters"],
    },
    longDescription: {
      type: String,
      required: [true, "Long description is required"],
      trim: true,
    },

    // Status and Metadata
    status: {
      type: String,
      enum: ["active", "inactive", "draft"],
      required: [true, "Status is required"],
      default: "active",
    },
    isFeatured: {
      type: Boolean,
      required: [true, "Featured flag is required"],
      default: false,
    },
    isPopular: {
      type: Boolean,
      required: [true, "Popular flag is required"],
      default: false,
    },
    verified: {
      type: Boolean,
      required: [true, "Verified flag is required"],
      default: false,
    },
    displayOrder: {
      type: Number,
      required: [true, "Display order is required"],
      default: 0,
    },
    faqs: [
      {
        question: { type: String, required: [true, "FAQ question is required"], trim: true },
        answer: { type: String, required: [true, "FAQ answer is required"], trim: true }
      }
    ],

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

countrySchema.path("countryGallery").validate(function (gallery) {
  return Array.isArray(gallery) && gallery.length > 0;
}, "At least one country gallery item is required");

countrySchema.path("quickFacts").validate(function (quickFacts) {
  return Array.isArray(quickFacts) && quickFacts.length > 0;
}, "At least one quick fact is required");

countrySchema.path("faqs").validate(function (faqs) {
  return Array.isArray(faqs) && faqs.length > 0;
}, "At least one FAQ is required");

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
