import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI;

// Schemas
const newsSchema = new mongoose.Schema({
  title: String,
  featuredImage: String,
  isFeatured: Boolean,
});

const blogSchema = new mongoose.Schema({
  title: String,
  featuredImage: String,
  isFeatured: Boolean,
});

const News = mongoose.models.News || mongoose.model("News", newsSchema);
const Blog = mongoose.models.Blog || mongoose.model("Blog", blogSchema);

async function downloadAndSeed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const newsDir = path.join(uploadsDir, "news");
    const blogsDir = path.join(uploadsDir, "blogs");

    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    if (!fs.existsSync(newsDir)) fs.mkdirSync(newsDir, { recursive: true });
    if (!fs.existsSync(blogsDir)) fs.mkdirSync(blogsDir, { recursive: true });

    // Download images for News
    const newsUrls = [
      "https://picsum.photos/seed/medical/800/600",
      "https://picsum.photos/seed/engineering/800/600",
      "https://picsum.photos/seed/students/800/600"
    ];

    const newsDocs = await News.find({ isFeatured: true });
    for (let i = 0; i < newsDocs.length; i++) {
      if (i >= newsUrls.length) break;
      const fileName = `news-featured-${i + 1}.jpg`;
      const filePath = path.join(newsDir, fileName);
      console.log(`Downloading News Image ${i + 1}...`);
      
      const res = await fetch(newsUrls[i]);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(filePath, buffer);
      
      newsDocs[i].featuredImage = `/uploads/news/${fileName}`;
      await newsDocs[i].save();
    }

    // Download images for Blogs
    const blogUrls = [
      "https://picsum.photos/seed/campus/800/600",
      "https://picsum.photos/seed/library/800/600",
      "https://picsum.photos/seed/exam/800/600"
    ];

    const blogDocs = await Blog.find({ isFeatured: true });
    for (let i = 0; i < blogDocs.length; i++) {
      if (i >= blogUrls.length) break;
      const fileName = `blog-featured-${i + 1}.jpg`;
      const filePath = path.join(blogsDir, fileName);
      console.log(`Downloading Blog Image ${i + 1}...`);
      
      const res = await fetch(blogUrls[i]);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(filePath, buffer);
      
      blogDocs[i].featuredImage = `/uploads/blogs/${fileName}`;
      await blogDocs[i].save();
    }

    console.log("Images downloaded and DB updated with LOCAL URLs!");
    mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

downloadAndSeed();
