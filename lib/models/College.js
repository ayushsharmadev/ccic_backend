import mongoose from "mongoose";

const collegeSchema = new mongoose.Schema(
  {
    // Basic Information - exact match with frontend
    name: {
      type: String,
      required: [true, "College name is required"],
      trim: true,
      maxlength: [200, "College name cannot exceed 200 characters"],
    },
    popularName: {
      type: String,
      trim: true,
      maxlength: [100, "Popular name cannot exceed 100 characters"],
    },
    shortName: {
      type: String,
      trim: true,
      maxlength: [50, "Short name cannot exceed 50 characters"],
    },
    estdYear: {
      type: String,
      trim: true,
      maxlength: [4, "Establishment year cannot exceed 4 characters"],
    },
    campusSize: {
      type: String,
      trim: true,
      maxlength: [50, "Campus size cannot exceed 50 characters"],
    },
    ownership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ownership",
      required: [true, "Ownership type is required"],
    },
    affiliation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Affiliation",
      required: [true, "Affiliation is required"],
    },
    languages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Language",
      },
    ],
    approvedThrough: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ApprovedThrough",
      },
    ],
    facilities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CollegeFacility",
        validate: {
          validator: function (v) {
            return mongoose.Types.ObjectId.isValid(v);
          },
          message: "Invalid facility ID",
        },
      },
    ],
    hospitalFacilities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HospitalFacility",
        validate: {
          validator: function (v) {
            return mongoose.Types.ObjectId.isValid(v);
          },
          message: "Invalid hospital facility ID",
        },
      },
    ],
    hostelFacilities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HostelFacility",
        validate: {
          validator: function (v) {
            return mongoose.Types.ObjectId.isValid(v);
          },
          message: "Invalid hostel facility ID",
        },
      },
    ],
    haveHostel: {
      type: Boolean,
      default: false,
    },
    haveHospital: {
      type: Boolean,
      default: false,
    },
    hospitalBeds: {
      type: Number,
      min: [0, "Hospital beds cannot be negative"],
    },
    intake: [
      {
        type: String,
        enum: [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ],
      },
    ],
    // Address Information - exact match with frontend
    addressLine1: {
      type: String,
      trim: true,
      maxlength: [200, "Address line 1 cannot exceed 200 characters"],
    },
    addressLine2: {
      type: String,
      trim: true,
      maxlength: [200, "Address line 2 cannot exceed 200 characters"],
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: [true, "Country is required"],
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
      required: [true, "State is required"],
    },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      required: [true, "District is required"],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: [100, "Landmark cannot exceed 100 characters"],
    },
    pinCode: {
      type: String,
      trim: true,
      maxlength: [10, "Pin code cannot exceed 10 characters"],
    },
    mapEmbedUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Map embed URL cannot exceed 500 characters"],
    },

    // Contact Information - exact match with frontend
    phoneNumber: {
      type: String,
      trim: true,
      maxlength: [20, "Phone number cannot exceed 20 characters"],
    },
    tollFreeNumber: {
      type: String,
      trim: true,
      maxlength: [20, "Toll free number cannot exceed 20 characters"],
    },
    helplineNumber: {
      type: String,
      trim: true,
      maxlength: [20, "Helpline number cannot exceed 20 characters"],
    },
    websiteUrl: {
      type: String,
      trim: true,
      maxlength: [200, "Website URL cannot exceed 200 characters"],
    },
    emailAddress: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [100, "Email address cannot exceed 100 characters"],
    },

    // Social Media Links - exact match with frontend
    facebookUrl: {
      type: String,
      trim: true,
      maxlength: [200, "Facebook URL cannot exceed 200 characters"],
    },
    twitterUrl: {
      type: String,
      trim: true,
      maxlength: [200, "Twitter URL cannot exceed 200 characters"],
    },
    instagramUrl: {
      type: String,
      trim: true,
      maxlength: [200, "Instagram URL cannot exceed 200 characters"],
    },
    youtubeUrl: {
      type: String,
      trim: true,
      maxlength: [200, "YouTube URL cannot exceed 200 characters"],
    },
    linkedinUrl: {
      type: String,
      trim: true,
      maxlength: [200, "LinkedIn URL cannot exceed 200 characters"],
    },

    // Media & Documents - exact match with frontend
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

    collegeGallery: [
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
    hostelGallery: [
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
    campusGallery: [
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

    // Description - exact match with frontend
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
      enum: ["active", "inactive", "draft", "pending"],
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
    isVerified: {
      type: Boolean,
      default: false,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, "Average rating cannot be negative"],
      max: [5, "Average rating cannot exceed 5"],
    },
    reviewsCount: {
      type: Number,
      default: 0,
      min: [0, "Reviews count cannot be negative"],
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
collegeSchema.index({ name: "text", popularName: "text", shortName: "text" });
collegeSchema.index({ country: 1, state: 1, district: 1 });
collegeSchema.index({ status: 1 });
collegeSchema.index({ isFeatured: 1 });
collegeSchema.index({ isPopular: 1 });
collegeSchema.index({ isVerified: 1 });
collegeSchema.index({ displayOrder: 1 });
// Compound indexes for frequent queries
collegeSchema.index({ status: 1, isFeatured: 1, displayOrder: 1 });
collegeSchema.index({ status: 1, isPopular: 1, displayOrder: 1 });
collegeSchema.index({ status: 1, displayOrder: 1 });

// Pre-save middleware to generate unique slug from name, district, and state
collegeSchema.pre("save", async function (next) {
  // Generate slug if name is modified and slug doesn't exist, or if district/state changed and we want to regenerate
  if ((this.isModified("name") || this.isModified("district") || this.isModified("state")) && !this.slug) {
    let slugParts = [];

    // Add college name
    if (this.name) {
      const nameSlug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim("-");
      slugParts.push(nameSlug);
    }

    // Add district name if available
    if (this.district) {
      let districtName = "";
      if (mongoose.Types.ObjectId.isValid(this.district)) {
        // If it's an ObjectId, populate it
        const District = mongoose.model("District");
        const district = await District.findById(this.district).select("name");
        if (district && district.name) {
          districtName = district.name;
        }
      } else if (typeof this.district === "object" && this.district.name) {
        // If already populated
        districtName = this.district.name;
      }

      if (districtName) {
        const districtSlug = districtName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim("-");
        slugParts.push(districtSlug);
      }
    }

    // Add state name if available
    if (this.state) {
      let stateName = "";
      if (mongoose.Types.ObjectId.isValid(this.state)) {
        // If it's an ObjectId, populate it
        const State = mongoose.model("State");
        const state = await State.findById(this.state).select("name");
        if (state && state.name) {
          stateName = state.name;
        }
      } else if (typeof this.state === "object" && this.state.name) {
        // If already populated
        stateName = this.state.name;
      }

      if (stateName) {
        const stateSlug = stateName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim("-");
        slugParts.push(stateSlug);
      }
    }

    // Combine all parts
    let baseSlug = slugParts.filter(Boolean).join("-");

    // Fallback to just name if no location available
    if (!baseSlug && this.name) {
      baseSlug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim("-");
    }

    let slug = baseSlug;
    let counter = 1;

    // Check for uniqueness and add counter if needed
    while (true) {
      const existingCollege = await this.constructor.findOne({ slug });
      if (
        !existingCollege ||
        existingCollege._id.toString() === this._id.toString()
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

// Virtual for full address
collegeSchema.virtual("fullAddress").get(function () {
  const parts = [
    this.addressLine1,
    this.addressLine2,
    this.location,
    this.landmark,
    this.district,
    this.state,
    this.pinCode,
  ].filter(Boolean);
  return parts.join(", ");
});

// Pre-save middleware
collegeSchema.pre("save", function (next) {
  // Auto-generate short name if not provided
  if (!this.shortName && this.name) {
    this.shortName = this.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  // Ensure facilities, hospitalFacilities and hostelFacilities are arrays
  if (!Array.isArray(this.facilities)) {
    this.facilities = [];
  }
  if (!Array.isArray(this.hospitalFacilities)) {
    this.hospitalFacilities = [];
  }
  if (!Array.isArray(this.hostelFacilities)) {
    this.hostelFacilities = [];
  }

  // Remove any duplicate IDs from arrays
  if (this.facilities.length > 0) {
    this.facilities = [...new Set(this.facilities.map((id) => id.toString()))];
  }
  if (this.hospitalFacilities.length > 0) {
    this.hospitalFacilities = [
      ...new Set(this.hospitalFacilities.map((id) => id.toString())),
    ];
  }
  if (this.hostelFacilities.length > 0) {
    this.hostelFacilities = [
      ...new Set(this.hostelFacilities.map((id) => id.toString())),
    ];
  }

  next();
});

// Utility methods for managing facilities
collegeSchema.methods.addFacility = function (facilityId) {
  if (!this.facilities.includes(facilityId)) {
    this.facilities.push(facilityId);
  }
  return this.save();
};

collegeSchema.methods.removeFacility = function (facilityId) {
  this.facilities = this.facilities.filter(
    (id) => id.toString() !== facilityId.toString()
  );
  return this.save();
};

collegeSchema.methods.hasFacility = function (facilityId) {
  return this.facilities.some((id) => id.toString() === facilityId.toString());
};

// Bulk operations
collegeSchema.methods.setFacilities = function (facilityIds) {
  if (!Array.isArray(facilityIds)) {
    throw new Error("facilityIds must be an array");
  }
  this.facilities = facilityIds;
  return this.save();
};

collegeSchema.methods.clearFacilities = function () {
  this.facilities = [];
  return this.save();
};

// Hospital facility methods
collegeSchema.methods.addHospitalFacility = function (facilityId) {
  if (!this.hospitalFacilities.includes(facilityId)) {
    this.hospitalFacilities.push(facilityId);
  }
  return this.save();
};

collegeSchema.methods.removeHospitalFacility = function (facilityId) {
  this.hospitalFacilities = this.hospitalFacilities.filter(
    (id) => id.toString() !== facilityId.toString()
  );
  return this.save();
};

collegeSchema.methods.hasHospitalFacility = function (facilityId) {
  return this.hospitalFacilities.some(
    (id) => id.toString() === facilityId.toString()
  );
};

collegeSchema.methods.setHospitalFacilities = function (facilityIds) {
  if (!Array.isArray(facilityIds)) {
    throw new Error("facilityIds must be an array");
  }
  this.hospitalFacilities = facilityIds;
  return this.save();
};

collegeSchema.methods.clearHospitalFacilities = function () {
  this.hospitalFacilities = [];
  return this.save();
};

collegeSchema.methods.getHospitalFacilitiesCount = function () {
  return this.hospitalFacilities.length;
};

// Hostel facility methods
collegeSchema.methods.addHostelFacility = function (facilityId) {
  if (!this.hostelFacilities.includes(facilityId)) {
    this.hostelFacilities.push(facilityId);
  }
  return this.save();
};

collegeSchema.methods.removeHostelFacility = function (facilityId) {
  this.hostelFacilities = this.hostelFacilities.filter(
    (id) => id.toString() !== facilityId.toString()
  );
  return this.save();
};

collegeSchema.methods.hasHostelFacility = function (facilityId) {
  return this.hostelFacilities.some(
    (id) => id.toString() === facilityId.toString()
  );
};

collegeSchema.methods.setHostelFacilities = function (facilityIds) {
  if (!Array.isArray(facilityIds)) {
    throw new Error("facilityIds must be an array");
  }
  this.hostelFacilities = facilityIds;
  return this.save();
};

collegeSchema.methods.clearHostelFacilities = function () {
  this.hostelFacilities = [];
  return this.save();
};

collegeSchema.methods.getHostelFacilitiesCount = function () {
  return this.hostelFacilities.length;
};

// Get counts
collegeSchema.methods.getFacilitiesCount = function () {
  return this.facilities.length;
};

export default mongoose.models.College ||
  mongoose.model("College", collegeSchema);
