import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Ownership from "@/lib/models/Ownership";

// GET /api/master/ownership/[id] - Get a single ownership type by ID
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Ownership ID is required" },
        { status: 400 }
      );
    }

    const ownership = await Ownership.findById(id).lean();

    if (!ownership) {
      return NextResponse.json(
        { success: false, error: "Ownership type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ownership,
    });
  } catch (error) {
    console.error("Error fetching ownership type:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ownership type" },
      { status: 500 }
    );
  }
}

// PUT /api/master/ownership/[id] - Update an ownership type by ID
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Ownership ID is required" },
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

    const updatedOwnership = await Ownership.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    );

    if (!updatedOwnership) {
      return NextResponse.json(
        { success: false, error: "Ownership type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ownership type updated successfully",
      data: updatedOwnership,
    });
  } catch (error) {
    console.error("Error updating ownership type:", error);

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
          error: "Ownership type with this name already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update ownership type" },
      { status: 500 }
    );
  }
}

// DELETE /api/master/ownership/[id] - Delete an ownership type by ID
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Ownership ID is required" },
        { status: 400 }
      );
    }

    const deletedOwnership = await Ownership.findByIdAndDelete(id);

    if (!deletedOwnership) {
      return NextResponse.json(
        { success: false, error: "Ownership type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ownership type deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting ownership type:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete ownership type" },
      { status: 500 }
    );
  }
}
