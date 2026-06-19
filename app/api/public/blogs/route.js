import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Blog from "@/lib/models/Blog";

// GET /api/public/blogs - Get public blogs (no auth required)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const count = searchParams.get("count");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const category = searchParams.get("category") || "";
    const featured = searchParams.get("featured");

    // Build filter - only published blogs
    const filter = {
      status: "published",
      isPublished: true,
    };

    if (category && category !== "all") {
      filter.category = category;
    }

    if (featured === "true") {
      filter.isFeatured = true;
    }

    // If only count is requested
    if (count === "true") {
      const totalCount = await Blog.countDocuments(filter);

      return NextResponse.json({
        success: true,
        data: {
          totalCount,
        },
      });
    }

    const skip = (page - 1) * limit;

    // Get blogs with pagination
    const [blogs, totalCount] = await Promise.all([
      Blog.find(filter)
        .populate("category", "name slug color")
        .populate("author", "firstName lastName")
        .select(
          "title slug excerpt featuredImage category author publishedAt views readTime isFeatured tags"
        )
        .sort({ publishedAt: -1 })
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
      isFeatured: item.isFeatured,
      tags: item.tags || [],
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        blogs: transformedBlogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching public blogs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}

