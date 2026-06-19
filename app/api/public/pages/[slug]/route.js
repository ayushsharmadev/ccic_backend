import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Page from "@/lib/models/Page";

// GET /api/public/pages/[slug] - Get page by slug
export async function GET(request, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { slug } = resolvedParams;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Page slug is required" },
        { status: 400 }
      );
    }

    const page = await Page.findOne({
      slug: slug,
      status: "active",
    })
      .populate("author", "username firstName lastName")
      .populate("category", "name slug")
      .lean();

    if (!page) {
      return NextResponse.json(
        { success: false, error: "Page not found" },
        { status: 404 }
      );
    }

    // Fetch related pages (same category, exclude current page)
    let relatedPages = [];
    if (page.category) {
      relatedPages = await Page.find({
        category: page.category._id,
        status: "active",
        _id: { $ne: page._id },
      })
        .select("title slug coverImage shortDescription")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
    }

    return NextResponse.json({
      success: true,
      data: {
        page,
        relatedPages,
      },
    });
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}

