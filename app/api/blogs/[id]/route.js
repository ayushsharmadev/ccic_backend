import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Blog from "@/lib/models/Blog";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/blogs/[id] - Get single blog
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Blog ID is required" },
        { status: 400 }
      );
    }

    const blog = await Blog.findById(id)
      .populate("category", "name slug color")
      .populate("author", "firstName lastName email")
      .lean({ virtuals: true });

    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        { status: 404 }
      );
    }

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
      isPublished: blog.isPublished,
      isFeatured: blog.isFeatured,
      publishedAt: blog.publishedAt,
      views: blog.views,
      readTime: blog.readTime,
      status: blog.status,
      displayOrder: blog.displayOrder,
      // SEO Fields
      metaTitle: blog.metaTitle,
      metaDescription: blog.metaDescription,
      metaKeywords: blog.metaKeywords || [],
      focusKeyword: blog.focusKeyword,
      canonicalUrl: blog.canonicalUrl,
      ogTitle: blog.ogTitle,
      ogDescription: blog.ogDescription,
      ogImage: blog.ogImage,
      twitterTitle: blog.twitterTitle,
      twitterDescription: blog.twitterDescription,
      twitterImage: blog.twitterImage,
      schemaMarkup: blog.schemaMarkup,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedBlog,
    });
  } catch (error) {
    console.error("Error fetching blog:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid blog ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch blog" },
      { status: 500 }
    );
  }
});

// PUT /api/blogs/[id] - Update blog
export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Blog ID is required" },
        { status: 400 }
      );
    }

    // Find existing blog
    const existingBlog = await Blog.findById(id);

    if (!existingBlog) {
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        { status: 404 }
      );
    }

    // Handle slug update
    if (body.slug && body.slug !== existingBlog.slug) {
      let slug = body.slug
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim("-");

      // Check if slug already exists (excluding current blog)
      let originalSlug = slug;
      let counter = 1;
      while (await Blog.findOne({ slug, _id: { $ne: id } })) {
        slug = `${originalSlug}-${counter}`;
        counter++;
      }

      body.slug = slug;
    }

    // Update blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        $set: {
          title: body.title,
          slug: body.slug,
          excerpt: body.excerpt,
          content: body.content,
          category: body.category,
          featuredImage: body.featuredImage,
          tags: body.tags,
          isPublished: body.isPublished,
          isFeatured: body.isFeatured,
          readTime: body.readTime,
          status: body.status,
          displayOrder: body.displayOrder,
          // SEO Fields
          metaTitle: body.metaTitle || body.title,
          metaDescription: body.metaDescription || body.excerpt,
          metaKeywords: body.metaKeywords || [],
          focusKeyword: body.focusKeyword || "",
          canonicalUrl: body.canonicalUrl || "",
          // Open Graph
          ogTitle: body.ogTitle || body.metaTitle || body.title,
          ogDescription: body.ogDescription || body.metaDescription || body.excerpt,
          ogImage: body.ogImage || body.featuredImage || "",
          // Twitter Card
          twitterTitle: body.twitterTitle || body.ogTitle || body.metaTitle || body.title,
          twitterDescription: body.twitterDescription || body.ogDescription || body.metaDescription || body.excerpt,
          twitterImage: body.twitterImage || body.ogImage || body.featuredImage || "",
          // Schema Markup
          schemaMarkup: body.schemaMarkup || "",
        },
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedBlog,
      message: "Blog updated successfully",
    });
  } catch (error) {
    console.error("Error updating blog:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Blog with this slug already exists" },
        { status: 400 }
      );
    }

    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid blog ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update blog" },
      { status: 500 }
    );
  }
});

// DELETE /api/blogs/[id] - Delete blog
export const DELETE = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Blog ID is required" },
        { status: 400 }
      );
    }

    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blog:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid blog ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete blog" },
      { status: 500 }
    );
  }
});

