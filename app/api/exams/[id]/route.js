import { withAdminAuth } from "@/lib/middleware/auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Exam from "@/lib/models/Exam";

// GET /api/exams/[id] - Get a single exam by ID
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Exam ID is required" },
        { status: 400 }
      );
    }

    const exam = await Exam.findById(id)
      .populate("stream", "name")
      .populate("courseName", "courseName")
      .populate("examType", "name shortName")
      .populate("country", "name code")
      .populate({
        path: "state",
        select: "name code country",
        populate: { path: "country", select: "name code" },
      })
      .lean();

    if (!exam) {
      return NextResponse.json(
        { success: false, error: "Exam not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: exam,
    });
  } catch (error) {
    console.error("Error fetching exam:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exam" },
      { status: 500 }
    );
  }
});

// PUT /api/exams/[id] - Update an exam by ID
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Exam ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ["stream", "courseName", "examType", "title", "country", "state"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const updatedExam = await Exam.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    ).populate("stream", "name")
      .populate("courseName", "courseName")
      .populate("examType", "name shortName")
      .populate("country", "name code")
      .populate("state", "name");

    if (!updatedExam) {
      return NextResponse.json(
        { success: false, error: "Exam not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Exam updated successfully",
      data: updatedExam,
    });
  } catch (error) {
    console.error("Error updating exam:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update exam" },
      { status: 500 }
    );
  }
}

// DELETE /api/exams/[id] - Delete an exam by ID
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Exam ID is required" },
        { status: 400 }
      );
    }

    const deletedExam = await Exam.findByIdAndDelete(id);

    if (!deletedExam) {
      return NextResponse.json(
        { success: false, error: "Exam not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Exam deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting exam:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete exam" },
      { status: 500 }
    );
  }
}
