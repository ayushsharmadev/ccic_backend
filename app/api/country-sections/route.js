import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CountrySection from "@/lib/models/CountrySection";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/country-sections - Get sections by country ID (Admin only)
export const GET = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get("countryId");

    if (!countryId) {
      return NextResponse.json(
        { success: false, error: "Country ID is required" },
        { status: 400 }
      );
    }

    const sections = await CountrySection.find({ country: countryId })
      .populate("country", "name")
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: sections,
    });
  } catch (error) {
    console.error("Error fetching country sections:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sections" },
      { status: 500 }
    );
  }
});

// POST /api/country-sections - Create a new section (Admin only)
export const POST = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    const title = body.title?.trim();
    const tabName = body.tabName?.trim();
    const content = body.content;

    if (!title || !tabName || !content || !body.country) {
      return NextResponse.json(
        {
          success: false,
          error: "Title, tab name, content, and country ID are required",
        },
        { status: 400 }
      );
    }

    // Create section
    const section = new CountrySection({
      title,
      tabName,
      content,
      country: body.country,
      displayOrder: body.displayOrder || 0,
      status: body.status || "active",
    });

    await section.save();
    await section.populate("country", "name");

    return NextResponse.json(
      {
        success: true,
        message: "Section created successfully",
        data: section,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    console.error("Error creating country section:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create section" },
      { status: 500 }
    );
  }
});
