import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Blog from "@/lib/models/Blog";
import mongoose from "mongoose";

// GET /api/public/blogs/[slug] - Get single blog by slug
export async function GET(request, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { slug } = resolvedParams;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Blog slug is required" },
        { status: 400 }
      );
    }

    // Find blog by slug or ID
    let query = { slug: slug, status: "published", isPublished: true };

    // If slug looks like an ObjectId, also search by _id
    if (mongoose.Types.ObjectId.isValid(slug)) {
      query = {
        $or: [
          { slug: slug, status: "published", isPublished: true },
          { _id: new mongoose.Types.ObjectId(slug), status: "published", isPublished: true },
        ],
      };
    }

    const blog = await Blog.findOne(query)
      .populate("category", "name slug color")
      .populate("author", "firstName lastName email")
      .lean({ virtuals: true });

    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        { status: 404 }
      );
    }

    // Increment views
    await Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } });

    // Transform the data
    const transformedBlog = {
      id: blog._id,
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      category: {
        id: blog.category?._id,
        name: blog.category?.name,
        slug: blog.category?.slug,
        color: blog.category?.color,
      },
      featuredImage: blog.featuredImage,
      author: {
        id: blog.author?._id,
        name:
          `${blog.author?.firstName || ""} ${blog.author?.lastName || ""
            }`.trim() || "Unknown",
        email: blog.author?.email,
      },
      tags: blog.tags || [],
      isFeatured: blog.isFeatured,
      publishedAt: blog.publishedAt,
      views: (blog.views || 0) + 1,
      readTime: blog.readTime || 5,
      formattedPublishedDate: blog.formattedPublishedDate,
      // SEO Fields for frontend
      metaTitle: blog.metaTitle || blog.title,
      metaDescription: blog.metaDescription || blog.excerpt,
      metaKeywords: blog.metaKeywords || [],
      focusKeyword: blog.focusKeyword || "",
      canonicalUrl: blog.canonicalUrl || "",
      ogTitle: blog.ogTitle || blog.metaTitle || blog.title,
      ogDescription: blog.ogDescription || blog.metaDescription || blog.excerpt,
      ogImage: blog.ogImage || blog.featuredImage || "",
      twitterTitle: blog.twitterTitle || blog.ogTitle || blog.metaTitle || blog.title,
      twitterDescription: blog.twitterDescription || blog.ogDescription || blog.metaDescription || blog.excerpt,
      twitterImage: blog.twitterImage || blog.ogImage || blog.featuredImage || "",
      schemaMarkup: blog.schemaMarkup || "",
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
    };

    // Get related blogs (same category, excluding current)
    const relatedBlogs = await Blog.find({
      status: "published",
      isPublished: true,
      category: blog.category?._id,
      _id: { $ne: blog._id },
    })
      .populate("category", "name slug color")
      .populate("author", "firstName lastName")
      .select("title slug excerpt featuredImage category author publishedAt views readTime")
      .sort({ publishedAt: -1 })
      .limit(3)
      .lean({ virtuals: true });

    const transformedRelatedBlogs = relatedBlogs.map((item) => ({
      id: item._id,
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt,
      featuredImage: item.featuredImage,
      category: {
        id: item.category?._id,
        name: item.category?.name,
        slug: item.category?.slug,
        color: item.category?.color,
      },
      author: {
        id: item.author?._id,
        name:
          `${item.author?.firstName || ""} ${item.author?.lastName || ""
            }`.trim() || "Unknown",
      },
      publishedAt: item.publishedAt,
      views: item.views || 0,
      readTime: item.readTime || 5,
    }));

    return NextResponse.json({
      success: true,
      data: {
        blog: transformedBlog,
        relatedBlogs: transformedRelatedBlogs,
      },
    });
  } catch (error) {
    console.error("Error fetching blog:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid blog format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch blog" },
      { status: 500 }
    );
  }
}

