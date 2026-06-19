import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CollegeFacility from "@/lib/models/CollegeFacility";

// GET /api/master/college-facility/[id] - Get a single college facility by ID
export async function GET(request, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "College facility ID is required" },
        { status: 400 }
      );
    }

    const facility = await CollegeFacility.findById(id).lean();

    if (!facility) {
      return NextResponse.json(
        { success: false, error: "College facility not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: facility,
    });
  } catch (error) {
    console.error("Error fetching college facility:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch college facility" },
      { status: 500 }
    );
  }
}

// PUT /api/master/college-facility/[id] - Update a college facility by ID
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "College facility ID is required" },
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

    const updatedFacility = await CollegeFacility.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    );

    if (!updatedFacility) {
      return NextResponse.json(
        { success: false, error: "College facility not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "College facility updated successfully",
      data: updatedFacility,
    });
  } catch (error) {
    console.error("Error updating college facility:", error);

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
          error: "College facility with this name already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update college facility" },
      { status: 500 }
    );
  }
}

// DELETE /api/master/college-facility/[id] - Delete a college facility by ID
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "College facility ID is required" },
        { status: 400 }
      );
    }

    const deletedFacility = await CollegeFacility.findByIdAndDelete(id);

    if (!deletedFacility) {
      return NextResponse.json(
        { success: false, error: "College facility not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "College facility deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting college facility:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete college facility" },
      { status: 500 }
    );
  }
}
