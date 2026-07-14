import { withAdminAuth } from "@/lib/middleware/auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import College from "@/lib/models/College";

// GET /api/colleges/[id]/facilities - Get facilities for a specific college
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "College ID is required" },
        { status: 400 }
      );
    }

    const college = await College.findById(id)
      .populate("facilities", "name image description status")
      .select("facilities")
      .lean();

    if (!college) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: college.facilities || [],
    });
  } catch (error) {
    console.error("Error fetching college facilities:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch college facilities" },
      { status: 500 }
    );
  }
});

// POST /api/colleges/[id]/facilities - Add facilities to a college
export async function POST(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "College ID is required" },
        { status: 400 }
      );
    }

    if (!body.facilityIds || !Array.isArray(body.facilityIds)) {
      return NextResponse.json(
        { success: false, error: "facilityIds array is required" },
        { status: 400 }
      );
    }

    const college = await College.findById(id);
    if (!college) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    // Add new facilities (avoid duplicates)
    body.facilityIds.forEach((facilityId) => {
      if (!college.facilities.includes(facilityId)) {
        college.facilities.push(facilityId);
      }
    });

    await college.save();

    // Populate and return updated facilities
    const updatedCollege = await College.findById(id)
      .populate("facilities", "name image description status")
      .select("facilities")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Facilities added successfully",
      data: updatedCollege.facilities,
    });
  } catch (error) {
    console.error("Error adding facilities to college:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to add facilities" },
      { status: 500 }
    );
  }
}

// DELETE /api/colleges/[id]/facilities - Remove facilities from a college
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "College ID is required" },
        { status: 400 }
      );
    }

    if (!body.facilityIds || !Array.isArray(body.facilityIds)) {
      return NextResponse.json(
        { success: false, error: "facilityIds array is required" },
        { status: 400 }
      );
    }

    const college = await College.findById(id);
    if (!college) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    // Remove specified facilities
    college.facilities = college.facilities.filter(
      (facilityId) => !body.facilityIds.includes(facilityId.toString())
    );

    await college.save();

    // Populate and return updated facilities
    const updatedCollege = await College.findById(id)
      .populate("facilities", "name image description status")
      .select("facilities")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Facilities removed successfully",
      data: updatedCollege.facilities,
    });
  } catch (error) {
    console.error("Error removing facilities from college:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove facilities" },
      { status: 500 }
    );
  }
}
