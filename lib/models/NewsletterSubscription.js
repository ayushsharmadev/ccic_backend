import mongoose from "mongoose";

const newsletterSubscriptionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email address is required"],
      trim: true,
      lowercase: true,
      unique: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Please enter a valid email address",
      },
    },
    source: {
      type: String,
      trim: true,
      default: "footer",
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    referrer: {
      type: String,
      trim: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

newsletterSubscriptionSchema.index({ createdAt: -1 });

const NewsletterSubscription =
  mongoose.models.NewsletterSubscription ||
  mongoose.model("NewsletterSubscription", newsletterSubscriptionSchema);

export default NewsletterSubscription;
