import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FacilitySection from "@/lib/models/FacilitySection";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/facility-sections/[id] - Get single section (Admin only)
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Section ID is required" },
        { status: 400 }
      );
    }

    const section = await FacilitySection.findById(id).populate(
      "college",
      "name"
    );

    if (!section) {
      return NextResponse.json(
        { success: false, error: "Section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: section,
    });
  } catch (error) {
    console.error("Error fetching facility section:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch section" },
      { status: 500 }
    );
  }
});

// PUT /api/facility-sections/[id] - Update section (Admin only)
export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Section ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    const title = body.title?.trim();
    const tabName = body.tabName?.trim();
    const content = body.content;

    if (!title || !tabName || !content) {
      return NextResponse.json(
        { success: false, error: "Title, tab name, and content are required" },
        { status: 400 }
      );
    }

    // Update section
    const section = await FacilitySection.findByIdAndUpdate(
      id,
      {
        title,
        tabName,
        content,
        displayOrder: body.displayOrder || 0,
        status: body.status || "active",
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).populate("college", "name");

    if (!section) {
      return NextResponse.json(
        { success: false, error: "Section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Section updated successfully",
      data: section,
    });
  } catch (error) {
    console.error("Error updating facility section:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update section" },
      { status: 500 }
    );
  }
});

// DELETE /api/facility-sections/[id] - Delete section (Admin only)
export const DELETE = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Section ID is required" },
        { status: 400 }
      );
    }

    const section = await FacilitySection.findByIdAndDelete(id);

    if (!section) {
      return NextResponse.json(
        { success: false, error: "Section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting facility section:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete section" },
      { status: 500 }
    );
  }
});

