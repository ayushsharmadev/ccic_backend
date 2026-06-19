import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Blog from "@/lib/models/Blog";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/blogs - Get all blogs with pagination and filters
export const GET = async (request) => {
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

    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
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

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get blogs with pagination
    const [blogs, totalCount] = await Promise.all([
      Blog.find(filter)
        .populate("category", "name slug color")
        .populate("author", "firstName lastName email")
        .select(
          "title slug excerpt content category featuredImage author tags isPublished isFeatured publishedAt views readTime status displayOrder createdAt updatedAt"
        )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      Blog.countDocuments(filter),
    ]);

    // Transform the data
    const transformedBlogs = blogs.map((item) => ({
      id: item._id,
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt,
      content: item.content,
      category: {
        id: item.category?._id,
        name: item.category?.name,
        slug: item.category?.slug,
        color: item.category?.color,
      },
      featuredImage: item.featuredImage,
      author: {
        id: item.author?._id,
        name:
          `${item.author?.firstName || ""} ${item.author?.lastName || ""
            }`.trim() || "Unknown",
        email: item.author?.email,
      },
      tags: item.tags || [],
      isPublished: item.isPublished,
      isFeatured: item.isFeatured,
      publishedAt: item.publishedAt,
      views: item.views,
      readTime: item.readTime,
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
      data: transformedBlogs,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
};

// POST /api/blogs - Create new blog
export const POST = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    if (
      !body.title ||
      !body.slug ||
      !body.excerpt ||
      !body.content ||
      !body.category
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Title, slug, excerpt, content, and category are required",
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
    while (await Blog.findOne({ slug })) {
      slug = `${originalSlug}-${counter}`;
      counter++;
    }

    // Create new blog
    const blog = new Blog({
      title: body.title,
      slug,
      excerpt: body.excerpt,
      content: body.content,
      category: body.category,
      featuredImage: body.featuredImage || null,
      author: userId,
      tags: body.tags || [],
      isPublished: body.isPublished || false,
      isFeatured: body.isFeatured || false,
      readTime: body.readTime || 5,
      status: body.status || "draft",
      displayOrder: body.displayOrder || 0,
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
    });

    const savedBlog = await blog.save();

    return NextResponse.json({
      success: true,
      data: savedBlog,
      message: "Blog created successfully",
    });
  } catch (error) {
    console.error("Error creating blog:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Blog with this slug already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create blog" },
      { status: 500 }
    );
  }
});

