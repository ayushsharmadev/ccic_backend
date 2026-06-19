import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FacilitySection from "@/lib/models/FacilitySection";

// GET /api/public/facility-sections/[slug] - Get section by slug and college ID
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get("collegeId");

    if (!slug || !collegeId) {
      return NextResponse.json(
        { success: false, error: "Slug and College ID are required" },
        { status: 400 }
      );
    }

    const section = await FacilitySection.findOne({
      slug: slug,
      college: collegeId,
      status: "active",
    })
      .select("title tabName slug content displayOrder")
      .lean();

    if (!section) {
      return NextResponse.json(
        { success: false, error: "Section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: section,
    });
  } catch (error) {
    console.error("Error fetching facility section:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch section" },
      { status: 500 }
    );
  }
}

