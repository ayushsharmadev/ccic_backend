import { withAdminAuth } from "@/lib/middleware/auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import HospitalFacility from "@/lib/models/HospitalFacility";

// GET /api/master/hospital-facility/[id] - Get a single hospital facility by ID
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Hospital facility ID is required" },
        { status: 400 }
      );
    }

    const facility = await HospitalFacility.findById(id).lean();

    if (!facility) {
      return NextResponse.json(
        { success: false, error: "Hospital facility not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: facility,
    });
  } catch (error) {
    console.error("Error fetching hospital facility:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch hospital facility" },
      { status: 500 }
    );
  }
});

// PUT /api/master/hospital-facility/[id] - Update a hospital facility by ID
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Hospital facility ID is required" },
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

    const updatedFacility = await HospitalFacility.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    );

    if (!updatedFacility) {
      return NextResponse.json(
        { success: false, error: "Hospital facility not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Hospital facility updated successfully",
      data: updatedFacility,
    });
  } catch (error) {
    console.error("Error updating hospital facility:", error);

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
          error: "Hospital facility with this name already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update hospital facility" },
      { status: 500 }
    );
  }
}

// DELETE /api/master/hospital-facility/[id] - Delete a hospital facility by ID
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Hospital facility ID is required" },
        { status: 400 }
      );
    }

    const deletedFacility = await HospitalFacility.findByIdAndDelete(id);

    if (!deletedFacility) {
      return NextResponse.json(
        { success: false, error: "Hospital facility not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Hospital facility deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting hospital facility:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete hospital facility" },
      { status: 500 }
    );
  }
}
