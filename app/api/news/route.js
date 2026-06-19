import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import News from "@/lib/models/News";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/news - Get all news with pagination and filters
export const GET = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";
    const isFeatured = searchParams.get("isFeatured") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    if (isFeatured !== "") {
      filter.isFeatured = isFeatured === "true";
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get news with pagination
    const [news, totalCount] = await Promise.all([
      News.find(filter)
        .populate("category", "name color")
        .populate("author", "firstName lastName email")
        .select(
          "title slug shortDescription content category featuredImage author tags isPublished isFeatured publishedAt views status displayOrder createdAt updatedAt"
        )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      News.countDocuments(filter),
    ]);

    // Transform the data
    const transformedNews = news.map((item) => ({
      id: item._id,
      title: item.title,
      slug: item.slug,
      shortDescription: item.shortDescription,
      content: item.content,
      category: {
        id: item.category?._id,
        name: item.category?.name,
        color: item.category?.color,
      },
      featuredImage: item.featuredImage,
      author: {
        id: item.author?._id,
        name:
          `${item.author?.firstName || ""} ${
            item.author?.lastName || ""
          }`.trim() || "Unknown",
        email: item.author?.email,
      },
      tags: item.tags || [],
      isPublished: item.isPublished,
      isFeatured: item.isFeatured,
      publishedAt: item.publishedAt,
      views: item.views,
      status: item.status,
      displayOrder: item.displayOrder,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        news: transformedNews,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit,
        },
        filters: {
          search,
          category,
          status,
          isFeatured,
          sortBy,
          sortOrder,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch news" },
      { status: 500 }
    );
  }
});

// POST /api/news - Create new news
export const POST = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const body = await request.json();

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

    // Get user ID from token (author)
    const userId = request.user.id;

    // Use slug from form and make it unique if needed
    let slug = body.slug
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");

    // Check if slug already exists and make it unique
    let originalSlug = slug;
    let counter = 1;
    while (await News.findOne({ slug })) {
      slug = `${originalSlug}-${counter}`;
      counter++;
    }

    // Create new news
    const news = new News({
      title: body.title,
      slug,
      shortDescription: body.shortDescription,
      content: body.content,
      category: body.category,
      featuredImage: body.featuredImage || null,
      author: userId,
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
    });

    const savedNews = await news.save();

    return NextResponse.json({
      success: true,
      message: "News created successfully",
      data: {
        id: savedNews._id,
        title: savedNews.title,
        slug: savedNews.slug,
        status: savedNews.status,
      },
    });
  } catch (error) {
    console.error("Error creating news:", error);

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
      { success: false, error: "Failed to create news" },
      { status: 500 }
    );
  }
});
