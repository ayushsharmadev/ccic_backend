import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FacilitySection from "@/lib/models/FacilitySection";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/facility-sections - Get sections by college ID (Admin only)
export const GET = withAdminAuth(async (request) => {
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

    const sections = await FacilitySection.find({ college: collegeId })
      .populate("college", "name")
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: sections,
    });
  } catch (error) {
    console.error("Error fetching facility sections:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sections" },
      { status: 500 }
    );
  }
});

// POST /api/facility-sections - Create a new section (Admin only)
export const POST = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    const title = body.title?.trim();
    const tabName = body.tabName?.trim();
    const content = body.content;

    if (!title || !tabName || !content || !body.college) {
      return NextResponse.json(
        {
          success: false,
          error: "Title, tab name, content, and college are required",
        },
        { status: 400 }
      );
    }

    // Create section
    const section = new FacilitySection({
      title,
      tabName,
      content,
      college: body.college,
      displayOrder: body.displayOrder || 0,
      status: body.status || "active",
    });

    await section.save();
    await section.populate("college", "name");

    return NextResponse.json(
      {
        success: true,
        message: "Section created successfully",
        data: section,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating facility section:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create section" },
      { status: 500 }
    );
  }
});

