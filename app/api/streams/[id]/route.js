import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Stream from "@/lib/models/Stream";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/streams/[id] - Get a single stream by ID
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Stream ID is required" },
        { status: 400 }
      );
    }

    const stream = await Stream.findById(id).lean();

    if (!stream) {
      return NextResponse.json(
        { success: false, error: "Stream not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stream,
    });
  } catch (error) {
    console.error("Error fetching stream:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stream" },
      { status: 500 }
    );
  }
}

// PUT /api/streams/[id] - Update a stream by ID (Admin only)
export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Stream ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ["name"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const updatedStream = await Stream.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    );

    if (!updatedStream) {
      return NextResponse.json(
        { success: false, error: "Stream not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Stream updated successfully",
      data: updatedStream,
    });
  } catch (error) {
    console.error("Error updating stream:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Stream with this name already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update stream" },
      { status: 500 }
    );
  }
});

// DELETE /api/streams/[id] - Delete a stream by ID
export const DELETE = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Stream ID is required" },
        { status: 400 }
      );
    }

    const deletedStream = await Stream.findByIdAndDelete(id);

    if (!deletedStream) {
      return NextResponse.json(
        { success: false, error: "Stream not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Stream deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting stream:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete stream" },
      { status: 500 }
    );
  }
});
