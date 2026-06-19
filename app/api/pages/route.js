import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Page from "@/lib/models/Page";
import { withAuth } from "@/lib/middleware/auth";

// GET /api/pages - Get all pages with pagination and filters
async function handleGET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { heading: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const [pages, totalCount] = await Promise.all([
      Page.find(query)
        .populate("author", "username email firstName lastName")
        .populate("category", "name slug")
        .select(
          "title slug heading coverImage videoUrl videoType category status displayOrder createdAt updatedAt"
        )
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Page.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        pages,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}

// POST /api/pages - Create new page
async function handlePOST(request) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    // Convert empty category to null
    if (body.category === "" || body.category === undefined) {
      body.category = null;
    }

    // Extract video ID from URL if videoUrl is provided
    if (body.videoUrl) {
      const url = body.videoUrl;

      // YouTube patterns
      const youtubePatterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
      ];

      // Vimeo pattern
      const vimeoPattern = /vimeo\.com\/(\d+)/;

      let videoId = null;
      let videoType = "other";

      // Check YouTube
      for (const pattern of youtubePatterns) {
        const match = url.match(pattern);
        if (match) {
          videoId = match[1];
          videoType = "youtube";
          break;
        }
      }

      // Check Vimeo if not YouTube
      if (!videoId) {
        const vimeoMatch = url.match(vimeoPattern);
        if (vimeoMatch) {
          videoId = vimeoMatch[1];
          videoType = "vimeo";
        }
      }

      body.videoId = videoId;
      body.videoType = videoType;
    }

    // Create page
    const page = await Page.create({
      ...body,
      author: request.user._id,
    });

    return NextResponse.json({
      success: true,
      data: page,
      message: "Page created successfully",
    });
  } catch (error) {
    console.error("Error creating page:", error);

    // Handle duplicate slug error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Page with this slug already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to create page" },
      { status: 500 }
    );
  }
}

// Export handlers with authentication
export const GET = withAuth(handleGET, { requireAdmin: true });
export const POST = withAuth(handlePOST, { requireAdmin: true });

