import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FooterSection from "@/lib/models/FooterSection";

// GET /api/public/footer-sections - Get active footer sections for public display
export async function GET() {
  try {
    await connectDB();

    // Build filter for active sections
    const filter = {
      isActive: true,
      sectionType: "links",
    };

    // Get all active footer sections, sorted by displayOrder
    const sections = await FooterSection.find(filter)
      .sort({ displayOrder: 1 })
      .select("title displayOrder links sectionType showArrowIcon")
      .lean({ virtuals: true });

    return NextResponse.json({
      success: true,
      data: {
        sections,
      },
    });
  } catch (error) {
    console.error("Error fetching public footer sections:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch footer sections" },
      { status: 500 }
    );
  }
}

