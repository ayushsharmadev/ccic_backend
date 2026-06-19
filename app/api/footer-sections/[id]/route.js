import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FooterSection from "@/lib/models/FooterSection";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/footer-sections/[id] - Get single footer section
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Section ID is required" },
        { status: 400 }
      );
    }

    const section = await FooterSection.findById(id).lean({ virtuals: true });

    if (!section) {
      return NextResponse.json(
        { success: false, error: "Footer section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: section,
    });
  } catch (error) {
    console.error("Error fetching footer section:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch footer section" },
      { status: 500 }
    );
  }
});

// PUT /api/footer-sections/[id] - Update footer section
export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Section ID is required" },
        { status: 400 }
      );
    }

    // Find section
    const section = await FooterSection.findById(id);

    if (!section) {
      return NextResponse.json(
        { success: false, error: "Footer section not found" },
        { status: 404 }
      );
    }


    // Validate links if provided
    if (body.links && Array.isArray(body.links)) {
      for (const link of body.links) {
        if (!link.title || !link.url) {
          return NextResponse.json(
            {
              success: false,
              error: "Each link must have a title and URL",
            },
            { status: 400 }
          );
        }
      }
    }

    // Update section
    const updateData = {};
    const allowedFields = [
      "title",
      "displayOrder",
      "links",
      "isActive",
      "sectionType",
      "showArrowIcon",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updatedSection = await FooterSection.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).lean({ virtuals: true });

    return NextResponse.json({
      success: true,
      message: "Footer section updated successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.error("Error updating footer section:", error);

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update footer section" },
      { status: 500 }
    );
  }
});

// DELETE /api/footer-sections/[id] - Delete footer section
export const DELETE = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Section ID is required" },
        { status: 400 }
      );
    }

    const section = await FooterSection.findByIdAndDelete(id);

    if (!section) {
      return NextResponse.json(
        { success: false, error: "Footer section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Footer section deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting footer section:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete footer section" },
      { status: 500 }
    );
  }
});

