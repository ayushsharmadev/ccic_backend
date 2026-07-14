import { withAdminAuth } from "@/lib/middleware/auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import College from "@/lib/models/College";

// GET /api/colleges/[id]/hostel-facilities - Get hostel facilities for a specific college
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
      .populate("hostelFacilities", "name image description status")
      .select("hostelFacilities")
      .lean();

    if (!college) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: college.hostelFacilities || [],
    });
  } catch (error) {
    console.error("Error fetching college hostel facilities:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch college hostel facilities" },
      { status: 500 }
    );
  }
});

// POST /api/colleges/[id]/hostel-facilities - Add hostel facilities to a college
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

    // Add new hostel facilities (avoid duplicates)
    body.facilityIds.forEach((facilityId) => {
      if (!college.hostelFacilities.includes(facilityId)) {
        college.hostelFacilities.push(facilityId);
      }
    });

    await college.save();

    // Populate and return updated hostel facilities
    const updatedCollege = await College.findById(id)
      .populate("hostelFacilities", "name image description status")
      .select("hostelFacilities")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Hostel facilities added successfully",
      data: updatedCollege.hostelFacilities,
    });
  } catch (error) {
    console.error("Error adding hostel facilities to college:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to add hostel facilities" },
      { status: 500 }
    );
  }
}

// DELETE /api/colleges/[id]/hostel-facilities - Remove hostel facilities from a college
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

    // Remove specified hostel facilities
    college.hostelFacilities = college.hostelFacilities.filter(
      (facilityId) => !body.facilityIds.includes(facilityId.toString())
    );

    await college.save();

    // Populate and return updated hostel facilities
    const updatedCollege = await College.findById(id)
      .populate("hostelFacilities", "name image description status")
      .select("hostelFacilities")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Hostel facilities removed successfully",
      data: updatedCollege.hostelFacilities,
    });
  } catch (error) {
    console.error("Error removing hostel facilities from college:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove hostel facilities" },
      { status: 500 }
    );
  }
}
