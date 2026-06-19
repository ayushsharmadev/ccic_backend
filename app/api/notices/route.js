import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Notice from "@/lib/models/Notice";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/notices - Get all notices (Admin only)
export const GET = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const collegeId = searchParams.get("collegeId") || null;

    const skip = (page - 1) * limit;

    // Build filter
    let filter = {};

    // Filter by college (null for global, specific ID for college-specific)
    if (collegeId === "global" || collegeId === "null") {
      filter.college = null;
    } else if (collegeId) {
      filter.college = collegeId;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { link: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await Notice.countDocuments(filter);

    // Get notices
    const notices = await Notice.find(filter)
      .populate("college", "name")
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: notices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching notices:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notices" },
      { status: 500 }
    );
  }
});

// POST /api/notices - Create a new notice (Admin only)
export const POST = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    // Create notice
    const notice = new Notice({
      title: body.title,
      content: body.content || "",
      link: body.link || "",
      displayOrder: body.displayOrder || 0,
      college: body.college || null,
      status: body.status || "active",
    });

    await notice.save();

    // Populate college if exists
    await notice.populate("college", "name");

    return NextResponse.json(
      {
        success: true,
        message: "Notice created successfully",
        data: notice,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating notice:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create notice" },
      { status: 500 }
    );
  }
});

