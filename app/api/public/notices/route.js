import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Notice from "@/lib/models/Notice";

// GET /api/public/notices - Get public notices (Global + College-specific)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get("collegeId");
    const type = searchParams.get("type"); // 'global' or 'college'
    const limit = parseInt(searchParams.get("limit")) || 10;

    let filter = { status: "active" };

    if (type === "global") {
      // Get only global notices (college is null)
      filter.college = null;
    } else if (type === "college" && collegeId) {
      // Get only college-specific notices
      filter.college = collegeId;
    } else if (collegeId) {
      // Get both global and college-specific notices
      filter.$or = [{ college: null }, { college: collegeId }];
    } else {
      // Get only global notices by default
      filter.college = null;
    }

    const notices = await Notice.find(filter)
      .select("title content link displayOrder createdAt")
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: notices,
      count: notices.length,
    });
  } catch (error) {
    console.error("Error fetching public notices:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notices" },
      { status: 500 }
    );
  }
}

