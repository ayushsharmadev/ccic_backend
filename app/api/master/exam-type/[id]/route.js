import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ExamType from "@/lib/models/ExamType";

// GET /api/master/exam-type/[id] - Get a single exam type by ID
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Exam type ID is required" },
        { status: 400 }
      );
    }

    const examType = await ExamType.findById(id).lean();

    if (!examType) {
      return NextResponse.json(
        { success: false, error: "Exam type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: examType,
    });
  } catch (error) {
    console.error("Error fetching exam type:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exam type" },
      { status: 500 }
    );
  }
}

// PUT /api/master/exam-type/[id] - Update an exam type by ID
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Exam type ID is required" },
        { status: 400 }
      );
    }

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

    const updatedExamType = await ExamType.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    );

    if (!updatedExamType) {
      return NextResponse.json(
        { success: false, error: "Exam type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Exam type updated successfully",
      data: updatedExamType,
    });
  } catch (error) {
    console.error("Error updating exam type:", error);

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
      { success: false, error: "Failed to update exam type" },
      { status: 500 }
    );
  }
}

// DELETE /api/master/exam-type/[id] - Delete an exam type by ID
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Exam type ID is required" },
        { status: 400 }
      );
    }

    const deletedExamType = await ExamType.findByIdAndDelete(id);

    if (!deletedExamType) {
      return NextResponse.json(
        { success: false, error: "Exam type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Exam type deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting exam type:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete exam type" },
      { status: 500 }
    );
  }
}
