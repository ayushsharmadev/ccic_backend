import { withAdminAuth } from "@/lib/middleware/auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import EligibilityCheck from "@/lib/models/EligibilityCheck";
import { verifyToken } from "@/lib/jwt";

// GET - Get single eligibility check (Admin only)
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const check = await EligibilityCheck.findById(params.id)
      .populate("course", "name slug")
      .populate("assignedTo", "firstName lastName username email")
      .lean();

    if (!check) {
      return NextResponse.json(
        { success: false, error: "Eligibility check not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: check,
    });
  } catch (error) {
    console.error("Error fetching eligibility check:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch eligibility check",
      },
      { status: 500 }
    );
  }
});

// PUT - Update eligibility check (Admin only)
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      status,
      isEligible,
      eligibilityRemarks,
      notes,
      assignedTo,
      tenthPassingYear,
      intermediateMarks,
    } = body;

    const updateData = {};

    if (status) updateData.status = status;
    if (isEligible !== undefined) updateData.isEligible = isEligible;
    if (eligibilityRemarks !== undefined) updateData.eligibilityRemarks = eligibilityRemarks;
    if (notes !== undefined) updateData.notes = notes;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
    if (tenthPassingYear !== undefined) {
      updateData.tenthPassingYear = tenthPassingYear ? parseInt(tenthPassingYear) : null;
    }
    if (intermediateMarks !== undefined) {
      updateData.intermediateMarks = intermediateMarks ? parseFloat(intermediateMarks) : null;
    }

    const check = await EligibilityCheck.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("course", "name slug")
      .populate("assignedTo", "firstName lastName username email");

    if (!check) {
      return NextResponse.json(
        { success: false, error: "Eligibility check not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Eligibility check updated successfully",
      data: check,
    });
  } catch (error) {
    console.error("Error updating eligibility check:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update eligibility check",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete eligibility check (Admin only)
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const check = await EligibilityCheck.findByIdAndDelete(params.id);

    if (!check) {
      return NextResponse.json(
        { success: false, error: "Eligibility check not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Eligibility check deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting eligibility check:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete eligibility check",
      },
      { status: 500 }
    );
  }
}

