import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import News from "@/lib/models/News";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/news/[id] - Get single news article
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { success: false, error: "News ID is required" },
        { status: 400 }
      );
    }

    // Find news article
    const news = await News.findById(id)
      .populate("category", "name color")
      .populate("author", "firstName lastName email")
      .lean({ virtuals: true });

    if (!news) {
      return NextResponse.json(
        { success: false, error: "News article not found" },
        { status: 404 }
      );
    }

    // Transform the data
    const transformedNews = {
      id: news._id,
      title: news.title,
      slug: news.slug,
      shortDescription: news.shortDescription,
      content: news.content,
      category: {
        id: news.category?._id,
        name: news.category?.name,
        color: news.category?.color,
      },
      featuredImage: news.featuredImage,
      author: {
        id: news.author?._id,
        name:
          `${news.author?.firstName || ""} ${
            news.author?.lastName || ""
          }`.trim() || "Unknown",
        email: news.author?.email,
      },
      tags: news.tags || [],
      isPublished: news.isPublished,
      isFeatured: news.isFeatured,
      publishedAt: news.publishedAt,
      views: news.views,
      status: news.status,
      displayOrder: news.displayOrder,
      // SEO Fields
      metaTitle: news.metaTitle,
      metaDescription: news.metaDescription,
      metaKeywords: news.metaKeywords || [],
      focusKeyword: news.focusKeyword,
      canonicalUrl: news.canonicalUrl,
      ogTitle: news.ogTitle,
      ogDescription: news.ogDescription,
      ogImage: news.ogImage,
      twitterTitle: news.twitterTitle,
      twitterDescription: news.twitterDescription,
      twitterImage: news.twitterImage,
      schemaMarkup: news.schemaMarkup,
      createdAt: news.createdAt,
      updatedAt: news.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedNews,
    });
  } catch (error) {
    console.error("Error fetching news:", error);

    // Handle cast error (invalid ObjectId)
    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid news ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch news" },
      { status: 500 }
    );
  }
});

// PUT /api/news/[id] - Update news article
export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { success: false, error: "News ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (
      !body.title ||
      !body.slug ||
      !body.shortDescription ||
      !body.content ||
      !body.category
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Title, slug, short description, content, and category are required",
        },
        { status: 400 }
      );
    }

    // User is authenticated via middleware

    // Use slug from form and make it unique if needed (excluding current news)
    let slug = body.slug
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");

    // Check if slug already exists and make it unique (excluding current news)
    let originalSlug = slug;
    let counter = 1;
    while (await News.findOne({ slug, _id: { $ne: id } })) {
      slug = `${originalSlug}-${counter}`;
      counter++;
    }

    // Update news article
    const updatedNews = await News.findByIdAndUpdate(
      id,
      {
        title: body.title,
        slug,
        shortDescription: body.shortDescription,
        content: body.content,
        category: body.category,
        featuredImage: body.featuredImage || null,
        tags: body.tags || [],
        isPublished: body.isPublished || false,
        isFeatured: body.isFeatured || false,
        status: body.status || "draft",
        displayOrder: body.displayOrder || 0,
        // SEO Fields
        metaTitle: body.metaTitle || body.title,
        metaDescription: body.metaDescription || body.shortDescription,
        metaKeywords: body.metaKeywords || [],
        focusKeyword: body.focusKeyword || "",
        canonicalUrl: body.canonicalUrl || "",
        // Open Graph
        ogTitle: body.ogTitle || body.metaTitle || body.title,
        ogDescription: body.ogDescription || body.metaDescription || body.shortDescription,
        ogImage: body.ogImage || body.featuredImage || "",
        // Twitter Card
        twitterTitle: body.twitterTitle || body.ogTitle || body.metaTitle || body.title,
        twitterDescription: body.twitterDescription || body.ogDescription || body.metaDescription || body.shortDescription,
        twitterImage: body.twitterImage || body.ogImage || body.featuredImage || "",
        // Schema Markup
        schemaMarkup: body.schemaMarkup || "",
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedNews) {
      return NextResponse.json(
        { success: false, error: "News article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "News updated successfully",
      data: {
        id: updatedNews._id,
        title: updatedNews.title,
        slug: updatedNews.slug,
        status: updatedNews.status,
      },
    });
  } catch (error) {
    console.error("Error updating news:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    // Handle cast error (invalid ObjectId)
    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid news ID format" },
        { status: 400 }
      );
    }

    // Handle duplicate key error (slug)
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "A news article with this slug already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update news" },
      { status: 500 }
    );
  }
});

// DELETE /api/news/[id] - Delete news article
export const DELETE = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { success: false, error: "News ID is required" },
        { status: 400 }
      );
    }

    // Delete news article
    const deletedNews = await News.findByIdAndDelete(id);

    if (!deletedNews) {
      return NextResponse.json(
        { success: false, error: "News article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "News deleted successfully",
      data: {
        id: deletedNews._id,
        title: deletedNews.title,
      },
    });
  } catch (error) {
    console.error("Error deleting news:", error);

    // Handle cast error (invalid ObjectId)
    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid news ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete news" },
      { status: 500 }
    );
  }
});
