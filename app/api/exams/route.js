import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Exam from "@/lib/models/Exam";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/exams - Get all exams with pagination and filters
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const stream = searchParams.get("stream") || "";
    const examType = searchParams.get("examType") || "";
    const examLevel = searchParams.get("examLevel") || "";
    const state = searchParams.get("state") || "";
    const country = searchParams.get("country") || "";
    const status = searchParams.get("status") || "";
    const isFeatured = searchParams.get("isFeatured") || "";

    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    if (search) {
      // Use regex search instead of text search for better compatibility
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { purpose: { $regex: search, $options: "i" } },
        { "examType.name": { $regex: search, $options: "i" } },
        { "examLevel.name": { $regex: search, $options: "i" } },
        { "stream.name": { $regex: search, $options: "i" } },
        { "state.name": { $regex: search, $options: "i" } },
      ];
    }

    if (stream) {
      filter.stream = stream;
    }

    if (examType) {
      filter.examType = examType;
    }

    if (examLevel) {
      filter.examLevel = examLevel;
    }

    if (country) {
      filter.country = country;
    }

    if (state) {
      filter.state = state;
    }

    if (status) {
      filter.status = status;
    }

    if (isFeatured !== "") {
      filter.isFeatured = isFeatured === "true";
    }

    // Get total count
    const total = await Exam.countDocuments(filter);

    // Get exams with pagination
    const exams = await Exam.find(filter)
      .populate("stream", "name")
      .populate("courseName", "courseName")
      .populate("examType", "name shortName")
      .populate("examLevel", "name")
      .populate("country", "name code")
      .populate("state", "name code")
      .sort({ displayOrder: 1, examDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: exams,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exams" },
      { status: 500 }
    );
  }
}

// POST /api/exams - Create a new exam
export const POST = withAdminAuth(async (request) => {
  try {
    await connectDB();

    // Debug: Check the Exam model schema
    console.log("🔍 Exam model schema fields:", Object.keys(Exam.schema.paths));
    console.log(
      "🔍 examType field type:",
      Exam.schema.paths.examType?.instance
    );
    console.log(
      "🔍 examLevel field type:",
      Exam.schema.paths.examLevel?.instance
    );

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "stream",
      "examType",
      "title",
      "examLevel",
      "country",
      "state",
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Create new exam
    const exam = new Exam(body);
    await exam.save();

    // Populate references for response
    const populatedExam = await Exam.findById(exam._id)
      .populate("stream", "name")
      .populate("courseName", "courseName")
      .populate("examType", "name shortName")
      .populate("examLevel", "name")
      .populate("country", "name code")
      .populate("state", "name code")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Exam created successfully",
        data: populatedExam,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating exam:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: errors[0] || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create exam" },
      { status: 500 }
    );
  }
});
