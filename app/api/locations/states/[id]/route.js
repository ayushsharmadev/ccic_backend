import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import State from "@/lib/models/State";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/locations/states/[id] - Get a single state by ID
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "State ID is required" },
        { status: 400 }
      );
    }

    const state = await State.findById(id)
      .populate("country", "name code")
      .lean();

    if (!state) {
      return NextResponse.json(
        { success: false, error: "State not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: state,
    });
  } catch (error) {
    console.error("Error fetching state:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch state" },
      { status: 500 }
    );
  }
});

// PUT /api/locations/states/[id] - Update a state by ID
export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "State ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ["name", "country"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const updatedState = await State.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    )
      .populate("country", "name code");

    if (!updatedState) {
      return NextResponse.json(
        { success: false, error: "State not found" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "State updated successfully",
      data: updatedState,
    });
  } catch (error) {
    console.error("Error updating state:", error);

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
          error: "State with this name already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update state" },
      { status: 500 }
    );
  }
});

// DELETE /api/locations/states/[id] - Delete a state by ID
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "State ID is required" },
        { status: 400 }
      );
    }

    const deletedState = await State.findByIdAndDelete(id);

    if (!deletedState) {
      return NextResponse.json(
        { success: false, error: "State not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "State deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting state:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete state" },
      { status: 500 }
    );
  }
}
