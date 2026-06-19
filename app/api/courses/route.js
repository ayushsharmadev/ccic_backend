import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Course from "@/lib/models/Course";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/courses - Get all courses with pagination and filters
export async function GET(request) {
  try {
    console.log("🔍 Courses API: Connecting to database...");
    await connectDB();
    console.log("🔍 Courses API: Database connected successfully");

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const streamName = searchParams.get("streamName") || "";
    const degreeType = searchParams.get("degreeType") || "";
    const status = searchParams.get("status") || "";
    const isFeatured = searchParams.get("isFeatured") || "";
    const all = searchParams.get("all");

    // If all parameter is present, return all courses without pagination
    if (all) {
      console.log("🔍 Fetching all courses with status: active");

      // First check if there are any courses at all
      const totalCourses = await Course.countDocuments({});
      console.log("🔍 Total courses in DB:", totalCourses);

      // Check courses with any status
      const allCourses = await Course.find({}).lean();
      console.log(
        "🔍 All courses statuses:",
        allCourses.map((c) => ({ name: c.name, status: c.status }))
      );

      const courses = await Course.find({ status: "active" })
        .populate("streamId", "name")
        .populate("degreeId", "name")
        .sort({ name: 1 })
        .lean();

      console.log("🔍 Active courses found:", courses.length);

      return NextResponse.json({
        success: true,
        data: courses,
      });
    }

    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    if (search) {
      // Use regex search instead of text search for better compatibility
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { "streamId.name": { $regex: search, $options: "i" } },
        { "degreeId.name": { $regex: search, $options: "i" } },
      ];
    }

    if (streamName) {
      filter.streamId = streamName;
    }

    if (degreeType) {
      filter.degreeId = degreeType;
    }

    if (status) {
      filter.status = status;
    }

    if (isFeatured !== "") {
      filter.isFeatured = isFeatured === "true";
    }

    // Get total count
    const total = await Course.countDocuments(filter);

    // Get courses with pagination
    const courses = await Course.find(filter)
      .populate("streamId", "name")
      .populate("degreeId", "name")
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Courses API Error:", error);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);

    return NextResponse.json(
      { success: false, error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course (Admin only)
export const POST = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    const requiredFields = ["name", "streamId", "degreeId"];
    for (const field of requiredFields) {
      if (!body[field]) {
        let fieldDisplayName;
        switch (field) {
          case "name":
            fieldDisplayName = "Course name";
            break;
          case "streamId":
            fieldDisplayName = "Stream";
            break;
          case "degreeId":
            fieldDisplayName = "Degree type";
            break;
          default:
            fieldDisplayName = field;
        }

        return NextResponse.json(
          {
            success: false,
            error: `${fieldDisplayName} is required`,
            details: [`${fieldDisplayName} is required`],
          },
          { status: 400 }
        );
      }
    }

    // Create new course
    const course = new Course(body);
    await course.save();

    // Populate references for response
    const populatedCourse = await Course.findById(course._id)
      .populate("streamId", "name")
      .populate("degreeId", "name")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Course created successfully",
        data: populatedCourse,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating course:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create course" },
      { status: 500 }
    );
  }
});
