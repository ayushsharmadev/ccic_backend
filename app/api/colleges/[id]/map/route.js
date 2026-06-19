import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import College from "@/lib/models/College";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/colleges/[id]/map - Get college map embed URL (Admin only)
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "College ID is required" },
        { status: 400 }
      );
    }

    const college = await College.findById(id).select("_id name mapEmbedUrl");

    if (!college) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: college._id,
        name: college.name,
        mapEmbedUrl: college.mapEmbedUrl || "",
      },
    });
  } catch (error) {
    console.error("Error fetching college map embed URL:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch map embed URL" },
      { status: 500 }
    );
  }
});

// PUT /api/colleges/[id]/map - Update college map embed URL (Admin only)
export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "College ID is required" },
        { status: 400 }
      );
    }

    const { mapEmbedUrl } = body;

    // Validate mapEmbedUrl length if provided
    if (mapEmbedUrl && mapEmbedUrl.length > 500) {
      return NextResponse.json(
        { success: false, error: "Map embed URL cannot exceed 500 characters" },
        { status: 400 }
      );
    }

    // Update only the mapEmbedUrl field
    const updatedCollege = await College.findByIdAndUpdate(
      id,
      {
        mapEmbedUrl: mapEmbedUrl || "",
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select("_id name mapEmbedUrl");

    if (!updatedCollege) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Map embed URL updated successfully",
      data: {
        id: updatedCollege._id,
        name: updatedCollege.name,
        mapEmbedUrl: updatedCollege.mapEmbedUrl,
      },
    });
  } catch (error) {
    console.error("Error updating college map embed URL:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update map embed URL" },
      { status: 500 }
    );
  }
});

