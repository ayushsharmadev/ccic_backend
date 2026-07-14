import { withAdminAuth } from "@/lib/middleware/auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import College from "@/lib/models/College";

// GET /api/colleges/[id]/courses - Get courses for a specific college
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "College ID is required" },
        { status: 400 }
      );
    }

    const college = await College.findById(id)
      .populate({
        path: "courses",
        select: "courseName streamName degreeType averageFee courseLogo status",
        populate: [
          { path: "streamName", select: "name" },
          { path: "degreeType", select: "name" },
        ],
      })
      .select("courses")
      .lean();

    if (!college) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: college.courses || [],
    });
  } catch (error) {
    console.error("Error fetching college courses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch college courses" },
      { status: 500 }
    );
  }
});

// POST /api/colleges/[id]/courses - Add courses to a college
export async function POST(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "College ID is required" },
        { status: 400 }
      );
    }

    if (!body.courseIds || !Array.isArray(body.courseIds)) {
      return NextResponse.json(
        { success: false, error: "courseIds array is required" },
        { status: 400 }
      );
    }

    const college = await College.findById(id);
    if (!college) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    // Add new courses (avoid duplicates)
    body.courseIds.forEach((courseId) => {
      if (!college.courses.includes(courseId)) {
        college.courses.push(courseId);
      }
    });

    await college.save();

    // Populate and return updated courses
    const updatedCollege = await College.findById(id)
      .populate({
        path: "courses",
        select: "courseName streamName degreeType averageFee courseLogo status",
        populate: [
          { path: "streamName", select: "name" },
          { path: "degreeType", select: "name" },
        ],
      })
      .select("courses")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Courses added successfully",
      data: updatedCollege.courses,
    });
  } catch (error) {
    console.error("Error adding courses to college:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to add courses" },
      { status: 500 }
    );
  }
}

// DELETE /api/colleges/[id]/courses - Remove courses from a college
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "College ID is required" },
        { status: 400 }
      );
    }

    if (!body.courseIds || !Array.isArray(body.courseIds)) {
      return NextResponse.json(
        { success: false, error: "courseIds array is required" },
        { status: 400 }
      );
    }

    const college = await College.findById(id);
    if (!college) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    // Remove specified courses
    college.courses = college.courses.filter(
      (courseId) => !body.courseIds.includes(courseId.toString())
    );

    await college.save();

    // Populate and return updated courses
    const updatedCollege = await College.findById(id)
      .populate({
        path: "courses",
        select: "courseName streamName degreeType averageFee courseLogo status",
        populate: [
          { path: "streamName", select: "name" },
          { path: "degreeType", select: "name" },
        ],
      })
      .select("courses")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Courses removed successfully",
      data: updatedCollege.courses,
    });
  } catch (error) {
    console.error("Error removing courses from college:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove courses" },
      { status: 500 }
    );
  }
}
