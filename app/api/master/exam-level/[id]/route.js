import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ExamLevel from "@/lib/models/ExamLevel";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET single exam level
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await dbConnect();

    const { id } = params;

    const examLevel = await ExamLevel.findById(id).select("-__v");

    if (!examLevel) {
      return NextResponse.json(
        { success: false, error: "Exam level not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: examLevel,
    });
  } catch (error) {
    console.error("Error fetching exam level:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exam level" },
      { status: 500 }
    );
  }
});

// PUT update exam level
export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await dbConnect();

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { name, status } = body;

    // Check if exam level exists
    const existingExamLevel = await ExamLevel.findById(id);
    if (!existingExamLevel) {
      return NextResponse.json(
        { success: false, error: "Exam level not found" },
        { status: 404 }
      );
    }

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Exam level name is required" },
        { status: 400 }
      );
    }

    // Check if name already exists (excluding current exam level)
    const duplicateName = await ExamLevel.findOne({
      name: name.trim(),
      _id: { $ne: id },
    });

    if (duplicateName) {
      return NextResponse.json(
        { success: false, error: "Exam level name already exists" },
        { status: 400 }
      );
    }

    // Update exam level
    const updatedExamLevel = await ExamLevel.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        status: status || "active",
      },
      { new: true, runValidators: true }
    ).select("-__v");

    return NextResponse.json({
      success: true,
      message: "Exam level updated successfully",
      data: updatedExamLevel,
    });
  } catch (error) {
    console.error("Error updating exam level:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update exam level" },
      { status: 500 }
    );
  }
});

// DELETE exam level
export const DELETE = withAdminAuth(async (request, { params }) => {
  try {
    await dbConnect();

    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Check if exam level exists
    const existingExamLevel = await ExamLevel.findById(id);
    if (!existingExamLevel) {
      return NextResponse.json(
        { success: false, error: "Exam level not found" },
        { status: 404 }
      );
    }

    // Check if exam level is being used by any exams
    // This would require checking the Exam model for references
    // For now, we'll allow deletion but you can add this check later

    // Delete exam level
    await ExamLevel.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Exam level deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting exam level:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete exam level" },
      { status: 500 }
    );
  }
});
