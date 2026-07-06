import { withAdminAuth } from "@/lib/middleware/auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Contact from "@/lib/models/Contact";
import { verifyToken } from "@/lib/jwt";
import mongoose from "mongoose";

// GET - Get single contact (Admin only)
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    // Verify admin token
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
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid contact ID" },
        { status: 400 }
      );
    }

    const contact = await Contact.findById(id)
      .populate("preferredColleges", "name slug")
      .populate("assignedTo", "firstName lastName username")
      .lean();

    if (!contact) {
      return NextResponse.json(
        { success: false, error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch contact",
      },
      { status: 500 }
    );
  }
});

// PUT - Update contact (Admin only)
export async function PUT(request, { params }) {
  try {
    // Verify admin token
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
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid contact ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, notes, assignedTo } = body;

    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

    const contact = await Contact.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("preferredColleges", "name slug")
      .populate("assignedTo", "firstName lastName username");

    if (!contact) {
      return NextResponse.json(
        { success: false, error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contact,
      message: "Contact updated successfully",
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update contact",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete contact (Admin only)
export async function DELETE(request, { params }) {
  try {
    // Verify admin token
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
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid contact ID" },
        { status: 400 }
      );
    }

    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return NextResponse.json(
        { success: false, error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete contact",
      },
      { status: 500 }
    );
  }
}

