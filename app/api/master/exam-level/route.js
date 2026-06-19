import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ExamLevel from "@/lib/models/ExamLevel";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET all exam levels
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;

    // Build filter
    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    if (status) {
      filter.status = status;
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Get total count
    const total = await ExamLevel.countDocuments(filter);

    // Get exam levels with pagination
    const examLevels = await ExamLevel.find(filter)
      .sort({ order: 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .select("-__v");

    return NextResponse.json({
      success: true,
      data: examLevels,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching exam levels:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exam levels" },
      { status: 500 }
    );
  }
}

// POST new exam level
export const POST = withAdminAuth(async (request) => {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, status } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Exam level name is required" },
        { status: 400 }
      );
    }

    // Check if name already exists
    const existingExamLevel = await ExamLevel.findOne({
      name: name.trim(),
    });

    if (existingExamLevel) {
      return NextResponse.json(
        { success: false, error: "Exam level name already exists" },
        { status: 400 }
      );
    }

    // Create new exam level
    const examLevel = new ExamLevel({
      name: name.trim(),
      status: status || "active",
    });

    await examLevel.save();

    return NextResponse.json(
      {
        success: true,
        message: "Exam level created successfully",
        data: examLevel,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating exam level:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create exam level" },
      { status: 500 }
    );
  }
});
