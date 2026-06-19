import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import News from "@/lib/models/News";

// GET /api/public/news - Get public news data (no auth required)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const count = searchParams.get("count");
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit")) || 6;

    // Build filter - only published news
    const filter = {
      status: "published",
    };

    if (featured === "true") {
      filter.isFeatured = true;
    }

    // If only count is requested
    if (count === "true") {
      const totalCount = await News.countDocuments(filter);

      return NextResponse.json({
        success: true,
        data: {
          totalCount,
        },
      });
    }

    // If featured news is requested
    if (featured === "true") {
      const news = await News.find(filter)
        .populate("category", "name color")
        .populate("author", "firstName lastName")
        .select(
          "title slug shortDescription featuredImage category author publishedAt views isFeatured"
        )
        .sort({ publishedAt: -1, views: -1 })
        .limit(limit)
        .lean({ virtuals: true });

      // Transform the data
      const transformedNews = news.map((item) => ({
        id: item._id,
        title: item.title,
        slug: item.slug,
        shortDescription: item.shortDescription,
        featuredImage: item.featuredImage,
        category: {
          id: item.category?._id,
          name: item.category?.name,
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
        isFeatured: item.isFeatured || false,
      }));

      return NextResponse.json({
        success: true,
        data: {
          news: transformedNews,
        },
      });
    }

    // Default: Get all published news with pagination
    const page = parseInt(searchParams.get("page")) || 1;
    const limitAll = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limitAll;

    const [news, totalCount] = await Promise.all([
      News.find(filter)
        .populate("category", "name color")
        .populate("author", "firstName lastName")
        .select(
          "title slug shortDescription featuredImage category author publishedAt views isFeatured"
        )
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limitAll)
        .lean({ virtuals: true }),
      News.countDocuments(filter),
    ]);

    // Transform the data
    const transformedNews = news.map((item) => ({
      id: item._id,
      title: item.title,
      slug: item.slug,
      shortDescription: item.shortDescription,
      featuredImage: item.featuredImage,
      category: {
        id: item.category?._id,
        name: item.category?.name,
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
      isFeatured: item.isFeatured || false,
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitAll);
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
          limit: limitAll,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching public news:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch news data" },
      { status: 500 }
    );
  }
}
