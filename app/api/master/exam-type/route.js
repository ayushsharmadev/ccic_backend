import { withAdminAuth } from "@/lib/middleware/auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ExamType from "@/lib/models/ExamType";

// GET /api/master/exam-type - Get all exam types with pagination and filters
export const GET = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const all = searchParams.get("all");

    // If all parameter is present, return all exam types without pagination
    if (all) {
      const examTypes = await ExamType.find({ status: "active" })
        .sort({ name: 1 })
        .lean();

      return NextResponse.json({
        success: true,
        data: examTypes,
      });
    }

    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    if (search) {
      // Use regex search instead of text search for better compatibility
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { shortName: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    // Get total count
    const total = await ExamType.countDocuments(filter);

    // Get exam types with pagination
    const examTypes = await ExamType.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: examTypes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching exam types:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exam types" },
      { status: 500 }
    );
  }
});

// POST /api/master/exam-type - Create a new exam type
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    const requiredFields = ["name", "shortName"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Create new exam type
    const examType = new ExamType(body);
    await examType.save();

    return NextResponse.json(
      {
        success: true,
        message: "Exam type created successfully",
        data: examType,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating exam type:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Exam type with this name or short name already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create exam type" },
      { status: 500 }
    );
  }
}
