import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Notice from "@/lib/models/Notice";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/notices/[id] - Get single notice (Admin only)
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Notice ID is required" },
        { status: 400 }
      );
    }

    const notice = await Notice.findById(id).populate("college", "name");

    if (!notice) {
      return NextResponse.json(
        { success: false, error: "Notice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notice,
    });
  } catch (error) {
    console.error("Error fetching notice:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notice" },
      { status: 500 }
    );
  }
});

// PUT /api/notices/[id] - Update notice (Admin only)
export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Notice ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    // Update notice
    const notice = await Notice.findByIdAndUpdate(
      id,
      {
        title: body.title,
        content: body.content || "",
        link: body.link || "",
        displayOrder: body.displayOrder || 0,
        college: body.college || null,
        status: body.status || "active",
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).populate("college", "name");

    if (!notice) {
      return NextResponse.json(
        { success: false, error: "Notice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notice updated successfully",
      data: notice,
    });
  } catch (error) {
    console.error("Error updating notice:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update notice" },
      { status: 500 }
    );
  }
});

// DELETE /api/notices/[id] - Delete notice (Admin only)
export const DELETE = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Notice ID is required" },
        { status: 400 }
      );
    }

    const notice = await Notice.findByIdAndDelete(id);

    if (!notice) {
      return NextResponse.json(
        { success: false, error: "Notice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notice deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notice:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete notice" },
      { status: 500 }
    );
  }
});

