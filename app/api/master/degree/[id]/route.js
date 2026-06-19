import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Degree from "@/lib/models/Degree";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/master/degree/[id] - Get a single degree by ID
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Degree ID is required" },
        { status: 400 }
      );
    }

    const degree = await Degree.findById(id).lean();

    if (!degree) {
      return NextResponse.json(
        { success: false, error: "Degree not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: degree,
    });
  } catch (error) {
    console.error("Error fetching degree:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch degree" },
      { status: 500 }
    );
  }
}

// PUT /api/master/degree/[id] - Update a degree by ID (Admin only)
export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Degree ID is required" },
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

    const updatedDegree = await Degree.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    );

    if (!updatedDegree) {
      return NextResponse.json(
        { success: false, error: "Degree not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Degree updated successfully",
      data: updatedDegree,
    });
  } catch (error) {
    console.error("Error updating degree:", error);

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
          error: "Degree with this name already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update degree" },
      { status: 500 }
    );
  }
});

// DELETE /api/master/degree/[id] - Delete a degree by ID (Admin only)
export const DELETE = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Degree ID is required" },
        { status: 400 }
      );
    }

    const deletedDegree = await Degree.findByIdAndDelete(id);

    if (!deletedDegree) {
      return NextResponse.json(
        { success: false, error: "Degree not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Degree deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting degree:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete degree" },
      { status: 500 }
    );
  }
});
