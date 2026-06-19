import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Notice from "@/lib/models/Notice";

// GET /api/public/notices/[id] - Get single notice by ID (Public)
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Notice ID is required" },
        { status: 400 }
      );
    }

    // Find notice by ID
    const notice = await Notice.findById(id)
      .select("title content college displayOrder status createdAt updatedAt")
      .populate({
        path: "college",
        select: "name slug",
      });

    if (!notice) {
      return NextResponse.json(
        { success: false, error: "Notice not found" },
        { status: 404 }
      );
    }

    // Only return active notices
    if (notice.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Notice not available" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: notice._id,
        title: notice.title,
        content: notice.content,
        college: notice.college ? {
          _id: notice.college._id,
          name: notice.college.name,
          slug: notice.college.slug,
        } : null,
        displayOrder: notice.displayOrder,
        status: notice.status,
        createdAt: notice.createdAt,
        updatedAt: notice.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching notice:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notice" },
      { status: 500 }
    );
  }
}

