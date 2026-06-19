import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ApprovedThrough from "@/lib/models/ApprovedThrough";

// GET /api/master/approved-through/[id] - Get a single approval authority by ID
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Approval authority ID is required" },
        { status: 400 }
      );
    }

    const approvalAuthority = await ApprovedThrough.findById(id).lean();

    if (!approvalAuthority) {
      return NextResponse.json(
        { success: false, error: "Approval authority not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: approvalAuthority,
    });
  } catch (error) {
    console.error("Error fetching approval authority:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch approval authority" },
      { status: 500 }
    );
  }
}

// PUT /api/master/approved-through/[id] - Update an approval authority by ID
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Approval authority ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ["name"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const updatedApprovalAuthority = await ApprovedThrough.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    );

    if (!updatedApprovalAuthority) {
      return NextResponse.json(
        { success: false, error: "Approval authority not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Approval authority updated successfully",
      data: updatedApprovalAuthority,
    });
  } catch (error) {
    console.error("Error updating approval authority:", error);

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
          error: "Approval authority with this name already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update approval authority" },
      { status: 500 }
    );
  }
}

// DELETE /api/master/approved-through/[id] - Delete an approval authority by ID
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Approval authority ID is required" },
        { status: 400 }
      );
    }

    const deletedApprovalAuthority = await ApprovedThrough.findByIdAndDelete(id);

    if (!deletedApprovalAuthority) {
      return NextResponse.json(
        { success: false, error: "Approval authority not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Approval authority deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting approval authority:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete approval authority" },
      { status: 500 }
    );
  }
}
