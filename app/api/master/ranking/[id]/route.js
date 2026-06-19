import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Ranking from "@/lib/models/Ranking";

// GET /api/master/ranking/[id] - Get a single ranking by ID
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Ranking ID is required" },
        { status: 400 }
      );
    }

    const ranking = await Ranking.findById(id).lean();

    if (!ranking) {
      return NextResponse.json(
        { success: false, error: "Ranking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ranking,
    });
  } catch (error) {
    console.error("Error fetching ranking:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ranking" },
      { status: 500 }
    );
  }
}

// PUT /api/master/ranking/[id] - Update a ranking by ID
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Ranking ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ["name", "rankValue"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const updatedRanking = await Ranking.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    );

    if (!updatedRanking) {
      return NextResponse.json(
        { success: false, error: "Ranking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ranking updated successfully",
      data: updatedRanking,
    });
  } catch (error) {
    console.error("Error updating ranking:", error);

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
          error: "Ranking with this name already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update ranking" },
      { status: 500 }
    );
  }
}

// DELETE /api/master/ranking/[id] - Delete a ranking by ID
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Ranking ID is required" },
        { status: 400 }
      );
    }

    const deletedRanking = await Ranking.findByIdAndDelete(id);

    if (!deletedRanking) {
      return NextResponse.json(
        { success: false, error: "Ranking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ranking deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting ranking:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete ranking" },
      { status: 500 }
    );
  }
}
