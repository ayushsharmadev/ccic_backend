import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CourseDuration from "@/lib/models/CourseDuration";

// GET /api/master/course-duration/[id] - Get a single course duration by ID
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Course duration ID is required" },
        { status: 400 }
      );
    }

    const duration = await CourseDuration.findById(id)
      .select("value unit name description status")
      .lean({ virtuals: true });

    if (!duration) {
      return NextResponse.json(
        { success: false, error: "Course duration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: duration,
    });
  } catch (error) {
    console.error("Error fetching course duration:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch course duration" },
      { status: 500 }
    );
  }
}

// PUT /api/master/course-duration/[id] - Update a course duration by ID
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Course duration ID is required" },
        { status: 400 }
      );
    }

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

    const normalizedUnit = body.unit?.toLowerCase();
    if (!["years", "months"].includes(normalizedUnit)) {
      return NextResponse.json(
        { success: false, error: "unit must be either 'years' or 'months'" },
        { status: 400 }
      );
    }

    const unitLabel =
      normalizedUnit === "years"
        ? numericValue === 1
          ? "Year"
          : "Years"
        : numericValue === 1
          ? "Month"
          : "Months";

    const updatePayload = {
      ...body,
      value: numericValue,
      unit: normalizedUnit,
      name: `${numericValue} ${unitLabel}`,
    };

    const updatedDuration = await CourseDuration.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!updatedDuration) {
      return NextResponse.json(
        { success: false, error: "Course duration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Course duration updated successfully",
      data: updatedDuration.toObject({ virtuals: true }),
    });
  } catch (error) {
    console.error("Error updating course duration:", error);

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
      { success: false, error: "Failed to update course duration" },
      { status: 500 }
    );
  }
}

// DELETE /api/master/course-duration/[id] - Delete a course duration by ID
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Course duration ID is required" },
        { status: 400 }
      );
    }

    const deletedDuration = await CourseDuration.findByIdAndDelete(id);

    if (!deletedDuration) {
      return NextResponse.json(
        { success: false, error: "Course duration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Course duration deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting course duration:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete course duration" },
      { status: 500 }
    );
  }
}
