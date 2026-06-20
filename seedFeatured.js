import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const categorySchema = new mongoose.Schema({
  name: String,
  slug: String,
});

const newsSchema = new mongoose.Schema({
  title: String,
  slug: String,
  shortDescription: String,
  content: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: "NewsCategory" },
  featuredImage: String,
  isFeatured: Boolean,
  status: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  publishedAt: Date,
  views: Number,
});

const blogSchema = new mongoose.Schema({
  title: String,
  slug: String,
  shortDescription: String,
  content: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: "BlogCategory" },
  featuredImage: String,
  isFeatured: Boolean,
  status: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  publishedAt: Date,
  views: Number,
  readTime: Number,
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
const NewsCategory = mongoose.models.NewsCategory || mongoose.model("NewsCategory", categorySchema);
const BlogCategory = mongoose.models.BlogCategory || mongoose.model("BlogCategory", categorySchema);
const News = mongoose.models.News || mongoose.model("News", newsSchema);
const Blog = mongoose.models.Blog || mongoose.model("Blog", blogSchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // 1. Get or create Author
    let author = await User.findOne({ email: "admin@ccic.in" });
    if (!author) {
      author = await User.create({ name: "CCIC Admin", email: "admin@ccic.in" });
    }

    // 2. Get or create Categories
    let newsCategory = await NewsCategory.findOne({ slug: "updates" });
    if (!newsCategory) {
      newsCategory = await NewsCategory.create({ name: "Updates", slug: "updates" });
    }

    let blogCategory = await BlogCategory.findOne({ slug: "guides" });
    if (!blogCategory) {
      blogCategory = await BlogCategory.create({ name: "Student Guides", slug: "guides" });
    }

    // 3. Clear old test data if any (only the featured ones we created)
    await News.deleteMany({ isFeatured: true });
    await Blog.deleteMany({ isFeatured: true });

    // 4. Create 3 Featured News
    const newsData = [
      {
        title: "NMC updates guidelines for FMGE 2026 Aspirants",
        slug: "nmc-fmge-update-2026",
        shortDescription: "Crucial updates from the National Medical Commission regarding eligibility and documentation for foreign medical graduates.",
        content: "<p>The NMC has released new guidelines...</p>",
        category: newsCategory._id,
        featuredImage: "https://images.unsplash.com/photo-1576091160550-2173ff9e5eb3?auto=format&fit=crop&w=800&q=80",
        isFeatured: true,
        status: "published",
        author: author._id,
        publishedAt: new Date(),
        views: 1245
      },
      {
        title: "Global Student Visa processing times reduced",
        slug: "visa-processing-times-reduced",
        shortDescription: "Good news for students! Many popular destinations have streamlined their visa processing, reducing wait times significantly.",
        content: "<p>Visa processing centers have announced...</p>",
        category: newsCategory._id,
        featuredImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
        isFeatured: true,
        status: "published",
        author: author._id,
        publishedAt: new Date(Date.now() - 86400000),
        views: 3890
      },
      {
        title: "New Scholarships Announced for Asian Universities",
        slug: "new-scholarships-asian-universities",
        shortDescription: "Top universities in China, Russia, and Central Asia have announced fully funded scholarships for Indian students.",
        content: "<p>The new scholarship program includes...</p>",
        category: newsCategory._id,
        featuredImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
        isFeatured: true,
        status: "published",
        author: author._id,
        publishedAt: new Date(Date.now() - 172800000),
        views: 5621
      }
    ];

    await News.insertMany(newsData);
    console.log("Inserted 3 Featured News");

    // 5. Create 3 Featured Blogs
    const blogData = [
      {
        title: "The Ultimate Pre-Departure Checklist for 2026",
        slug: "pre-departure-checklist-2026",
        shortDescription: "Everything you need to pack, document, and prepare before you board your flight for your MBBS journey abroad.",
        content: "<p>Here is the complete checklist...</p>",
        category: blogCategory._id,
        featuredImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80",
        isFeatured: true,
        status: "published",
        author: author._id,
        publishedAt: new Date(),
        views: 4500,
        readTime: 5
      },
      {
        title: "How to manage finances as an International Student",
        slug: "managing-finances-abroad",
        shortDescription: "Smart tips to save money, manage daily expenses, and handle forex cards while studying medicine abroad.",
        content: "<p>Managing finances is crucial...</p>",
        category: blogCategory._id,
        featuredImage: "https://images.unsplash.com/photo-1580519542036-ed47f3e42214?auto=format&fit=crop&w=800&q=80",
        isFeatured: true,
        status: "published",
        author: author._id,
        publishedAt: new Date(Date.now() - 86400000),
        views: 3200,
        readTime: 7
      },
      {
        title: "Understanding the FMGE vs NEXT Exam Pattern",
        slug: "fmge-vs-next-pattern",
        shortDescription: "A detailed breakdown of the upcoming NEXT exam format and how it differs from the traditional FMGE test.",
        content: "<p>The NEXT exam replaces...</p>",
        category: blogCategory._id,
        featuredImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
        isFeatured: true,
        status: "published",
        author: author._id,
        publishedAt: new Date(Date.now() - 172800000),
        views: 8900,
        readTime: 10
      }
    ];

    await Blog.insertMany(blogData);
    console.log("Inserted 3 Featured Blogs");

    mongoose.disconnect();
    console.log("Done seeding.");
  } catch (error) {
    console.error("Error seeding:", error);
    process.exit(1);
  }
}

seed();
