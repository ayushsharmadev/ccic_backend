import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import HostelFacility from "@/lib/models/HostelFacility";

// GET /api/master/hostel-facility/[id] - Get a single hostel facility by ID
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Hostel facility ID is required" },
        { status: 400 }
      );
    }

    const facility = await HostelFacility.findById(id).lean();

    if (!facility) {
      return NextResponse.json(
        { success: false, error: "Hostel facility not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: facility,
    });
  } catch (error) {
    console.error("Error fetching hostel facility:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch hostel facility" },
      { status: 500 }
    );
  }
}

// PUT /api/master/hostel-facility/[id] - Update a hostel facility by ID
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Hostel facility ID is required" },
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

    const updatedFacility = await HostelFacility.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    );

    if (!updatedFacility) {
      return NextResponse.json(
        { success: false, error: "Hostel facility not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Hostel facility updated successfully",
      data: updatedFacility,
    });
  } catch (error) {
    console.error("Error updating hostel facility:", error);

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
          error: "Hostel facility with this name already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update hostel facility" },
      { status: 500 }
    );
  }
}

// DELETE /api/master/hostel-facility/[id] - Delete a hostel facility by ID
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Hostel facility ID is required" },
        { status: 400 }
      );
    }

    const deletedFacility = await HostelFacility.findByIdAndDelete(id);

    if (!deletedFacility) {
      return NextResponse.json(
        { success: false, error: "Hostel facility not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Hostel facility deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting hostel facility:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete hostel facility" },
      { status: 500 }
    );
  }
}
