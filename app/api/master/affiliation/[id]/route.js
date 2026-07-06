import { withAdminAuth } from "@/lib/middleware/auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Affiliation from "@/lib/models/Affiliation";

// GET /api/master/affiliation/[id] - Get a single affiliation by ID
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Affiliation ID is required" },
        { status: 400 }
      );
    }

    const affiliation = await Affiliation.findById(id).lean();

    if (!affiliation) {
      return NextResponse.json(
        { success: false, error: "Affiliation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: affiliation,
    });
  } catch (error) {
    console.error("Error fetching affiliation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch affiliation" },
      { status: 500 }
    );
  }
});

// PUT /api/master/affiliation/[id] - Update an affiliation by ID
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Affiliation ID is required" },
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

    const updatedAffiliation = await Affiliation.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    );

    if (!updatedAffiliation) {
      return NextResponse.json(
        { success: false, error: "Affiliation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Affiliation updated successfully",
      data: updatedAffiliation,
    });
  } catch (error) {
    console.error("Error updating affiliation:", error);

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
          error: "Affiliation with this name already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update affiliation" },
      { status: 500 }
    );
  }
}

// DELETE /api/master/affiliation/[id] - Delete an affiliation by ID
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Affiliation ID is required" },
        { status: 400 }
      );
    }

    const deletedAffiliation = await Affiliation.findByIdAndDelete(id);

    if (!deletedAffiliation) {
      return NextResponse.json(
        { success: false, error: "Affiliation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Affiliation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting affiliation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete affiliation" },
      { status: 500 }
    );
  }
}
