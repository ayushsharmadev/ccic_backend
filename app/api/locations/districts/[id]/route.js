import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import District from "@/lib/models/District";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/locations/districts/[id] - Get a single district by ID
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "District ID is required" },
        { status: 400 }
      );
    }

    const district = await District.findById(id)
      .populate({
        path: "state",
        select: "name code country",
        populate: { path: "country", select: "name code" },
      })
      .lean();

    if (!district) {
      return NextResponse.json(
        { success: false, error: "District not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: district,
    });
  } catch (error) {
    console.error("Error fetching district:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch district" },
      { status: 500 }
    );
  }
}

// PUT /api/locations/districts/[id] - Update a district by ID
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "District ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ["name", "state"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const updatedDistrict = await District.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    ).populate("state", "name code");

    if (!updatedDistrict) {
      return NextResponse.json(
        { success: false, error: "District not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "District updated successfully",
      data: updatedDistrict,
    });
  } catch (error) {
    console.error("Error updating district:", error);

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
          error: "District with this name already exists in the selected state",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update district" },
      { status: 500 }
    );
  }
}

// DELETE /api/locations/districts/[id] - Delete a district by ID (Admin only)
export const DELETE = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "District ID is required" },
        { status: 400 }
      );
    }

    const deletedDistrict = await District.findByIdAndDelete(id);

    if (!deletedDistrict) {
      return NextResponse.json(
        { success: false, error: "District not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "District deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting district:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete district" },
      { status: 500 }
    );
  }
});
