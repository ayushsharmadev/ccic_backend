import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FacilitySection from "@/lib/models/FacilitySection";

// GET /api/public/facility-sections - Get public sections by college ID
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get("collegeId");

    if (!collegeId) {
      return NextResponse.json(
        { success: false, error: "College ID is required" },
        { status: 400 }
      );
    }

    const sections = await FacilitySection.find({
      college: collegeId,
      status: "active",
    })
      .select("title tabName slug content displayOrder")
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: sections,
    });
  } catch (error) {
    console.error("Error fetching public facility sections:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sections" },
      { status: 500 }
    );
  }
}

