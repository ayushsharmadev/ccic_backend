import { withAdminAuth } from "@/lib/middleware/auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CourseDuration from "@/lib/models/CourseDuration";

// GET /api/master/course-duration - Get all course durations with pagination and filters
export const GET = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const all = searchParams.get("all");

    // If all parameter is present, return all course durations without pagination
    if (all) {
      const durations = await CourseDuration.find({ status: "active" })
        .sort({ value: 1 })
        .select("value unit name description status")
        .lean({ virtuals: true });

      return NextResponse.json({
        success: true,
        data: durations,
      });
    }

    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    if (search) {
      // Use regex search instead of text search for better compatibility
      filter.$or = [{ name: { $regex: search, $options: "i" } }];
    }

    if (status) {
      filter.status = status;
    }

    // Get total count
    const total = await CourseDuration.countDocuments(filter);

    // Get course durations with pagination
    const durations = await CourseDuration.find(filter)
      .sort({ value: 1 })
      .select("value unit name description status")
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true });

    return NextResponse.json({
      success: true,
      data: durations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching course durations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch course durations" },
      { status: 500 }
    );
  }
});

// POST /api/master/course-duration - Create a new course duration
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    const requiredFields = ["value", "unit"];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const numericValue = Number(body.value);
    if (Number.isNaN(numericValue) || numericValue <= 0) {
      return NextResponse.json(
        { success: false, error: "value must be a positive number" },
        { status: 400 }
      );
    }

    body.value = numericValue;
    body.unit = body.unit?.toLowerCase();

    if (!["years", "months"].includes(body.unit)) {
      return NextResponse.json(
        { success: false, error: "unit must be either 'years' or 'months'" },
        { status: 400 }
      );
    }
    const unitLabel =
      body.unit === "years"
        ? numericValue === 1
          ? "Year"
          : "Years"
        : numericValue === 1
          ? "Month"
          : "Months";

    body.name = `${numericValue} ${unitLabel}`;

    // Create new course duration
    const duration = new CourseDuration(body);
    await duration.save();

    return NextResponse.json(
      {
        success: true,
        message: "Course duration created successfully",
        data: duration.toObject({ virtuals: true }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating course duration:", error);

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
          error: "Course duration with this value and unit already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create course duration" },
      { status: 500 }
    );
  }
}
