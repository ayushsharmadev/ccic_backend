import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Page from "@/lib/models/Page";
import { withAuth } from "@/lib/middleware/auth";
import mongoose from "mongoose";

// GET /api/pages/[id] - Get single page
async function handleGET(request, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid page ID" },
        { status: 400 }
      );
    }

    const page = await Page.findById(id)
      .populate("author", "username email firstName lastName")
      .populate("category", "name slug")
      .lean();

    if (!page) {
      return NextResponse.json(
        { success: false, error: "Page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}

// PUT /api/pages/[id] - Update page
async function handlePUT(request, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid page ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Convert empty category to null
    if (body.category === "" || body.category === undefined) {
      body.category = null;
    }

    // Extract video ID from URL if videoUrl is modified
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

    const page = await Page.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate("author", "username email firstName lastName")
      .populate("category", "name slug");

    if (!page) {
      return NextResponse.json(
        { success: false, error: "Page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: page,
      message: "Page updated successfully",
    });
  } catch (error) {
    console.error("Error updating page:", error);

    // Handle duplicate slug error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Page with this slug already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to update page" },
      { status: 500 }
    );
  }
}

// DELETE /api/pages/[id] - Delete page
async function handleDELETE(request, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid page ID" },
        { status: 400 }
      );
    }

    const page = await Page.findByIdAndDelete(id);

    if (!page) {
      return NextResponse.json(
        { success: false, error: "Page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Page deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting page:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete page" },
      { status: 500 }
    );
  }
}

// Export handlers with authentication
export const GET = withAuth(handleGET, { requireAdmin: true });
export const PUT = withAuth(handlePUT, { requireAdmin: true });
export const DELETE = withAuth(handleDELETE, { requireAdmin: true });

