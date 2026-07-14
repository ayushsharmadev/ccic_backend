import { withAdminAuth } from "@/lib/middleware/auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import College from "@/lib/models/College";

// GET /api/colleges/[id]/hospital-facilities - Get hospital facilities for a specific college
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
      .populate("hospitalFacilities", "name image description status")
      .select("hospitalFacilities")
      .lean();

    if (!college) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: college.hospitalFacilities || [],
    });
  } catch (error) {
    console.error("Error fetching college hospital facilities:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch college hospital facilities" },
      { status: 500 }
    );
  }
});

// POST /api/colleges/[id]/hospital-facilities - Add hospital facilities to a college
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

    // Add new hospital facilities (avoid duplicates)
    body.facilityIds.forEach((facilityId) => {
      if (!college.hospitalFacilities.includes(facilityId)) {
        college.hospitalFacilities.push(facilityId);
      }
    });

    await college.save();

    // Populate and return updated hospital facilities
    const updatedCollege = await College.findById(id)
      .populate("hospitalFacilities", "name image description status")
      .select("hospitalFacilities")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Hospital facilities added successfully",
      data: updatedCollege.hospitalFacilities,
    });
  } catch (error) {
    console.error("Error adding hospital facilities to college:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to add hospital facilities" },
      { status: 500 }
    );
  }
}

// DELETE /api/colleges/[id]/hospital-facilities - Remove hospital facilities from a college
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

    // Remove specified hospital facilities
    college.hospitalFacilities = college.hospitalFacilities.filter(
      (facilityId) => !body.facilityIds.includes(facilityId.toString())
    );

    await college.save();

    // Populate and return updated hospital facilities
    const updatedCollege = await College.findById(id)
      .populate("hospitalFacilities", "name image description status")
      .select("hospitalFacilities")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Hospital facilities removed successfully",
      data: updatedCollege.hospitalFacilities,
    });
  } catch (error) {
    console.error("Error removing hospital facilities from college:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove hospital facilities" },
      { status: 500 }
    );
  }
}
