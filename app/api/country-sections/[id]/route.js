import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CountrySection from "@/lib/models/CountrySection";
import mongoose from "mongoose";
import { withAdminAuth } from "@/lib/middleware/auth";

export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid section ID format" },
        { status: 400 }
      );
    }

    const section = await CountrySection.findById(id).lean();

    if (!section) {
      return NextResponse.json(
        { success: false, error: "Section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: section,
    });
  } catch (error) {
    console.error("Error fetching country section:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch section" },
      { status: 500 }
    );
  }
});

export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid section ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const updatedSection = await CountrySection.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedSection) {
      return NextResponse.json(
        { success: false, error: "Section not found" },
        { status: 404 }
      );
    }

    // Trigger pre-save middleware to update slug if title changed
    if (body.title) {
      await updatedSection.save();
    }

    return NextResponse.json({
      success: true,
      message: "Section updated successfully",
      data: updatedSection,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }
    
    console.error("Error updating country section:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update section" },
      { status: 500 }
    );
  }
});

export const DELETE = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid section ID format" },
        { status: 400 }
      );
    }

    const section = await CountrySection.findById(id);

    if (!section) {
      return NextResponse.json(
        { success: false, error: "Section not found" },
        { status: 404 }
      );
    }

    await CountrySection.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting country section:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete section" },
      { status: 500 }
    );
  }
});
