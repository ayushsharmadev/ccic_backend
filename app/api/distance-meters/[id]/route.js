import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import DistanceMeter from "@/lib/models/DistanceMeter";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/distance-meters/[id] - Get single distance meter
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Distance meter ID is required" },
        { status: 400 }
      );
    }

    const distanceMeter = await DistanceMeter.findById(id).lean();

    if (!distanceMeter) {
      return NextResponse.json(
        { success: false, error: "Distance meter not found" },
        { status: 404 }
      );
    }

    // Transform the data
    const transformedDistanceMeter = {
      id: distanceMeter._id,
      name: distanceMeter.name,
      shortDescription: distanceMeter.shortDescription || "",
      icon: distanceMeter.icon || "",
      status: distanceMeter.status,
      createdAt: distanceMeter.createdAt,
      updatedAt: distanceMeter.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedDistanceMeter,
    });
  } catch (error) {
    console.error("Error fetching distance meter:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid distance meter ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch distance meter" },
      { status: 500 }
    );
  }
});

// PUT /api/distance-meters/[id] - Update distance meter
export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Distance meter ID is required" },
        { status: 400 }
      );
    }

    // Find existing distance meter
    const existingDistanceMeter = await DistanceMeter.findById(id);

    if (!existingDistanceMeter) {
      return NextResponse.json(
        { success: false, error: "Distance meter not found" },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Distance meter name is required",
        },
        { status: 400 }
      );
    }

    // Update distance meter
    const updatedDistanceMeter = await DistanceMeter.findByIdAndUpdate(
      id,
      {
        $set: {
          name: body.name,
          shortDescription: body.shortDescription || "",
          icon: body.icon || "",
          status: body.status || "active",
        },
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedDistanceMeter,
      message: "Distance meter updated successfully",
    });
  } catch (error) {
    console.error("Error updating distance meter:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Distance meter with this name already exists",
        },
        { status: 400 }
      );
    }

    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid distance meter ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update distance meter" },
      { status: 500 }
    );
  }
});

// DELETE /api/distance-meters/[id] - Delete distance meter
export const DELETE = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Distance meter ID is required" },
        { status: 400 }
      );
    }

    const distanceMeter = await DistanceMeter.findByIdAndDelete(id);

    if (!distanceMeter) {
      return NextResponse.json(
        { success: false, error: "Distance meter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Distance meter deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting distance meter:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid distance meter ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete distance meter" },
      { status: 500 }
    );
  }
});

