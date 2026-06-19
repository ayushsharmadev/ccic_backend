import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Testimonial from "@/lib/models/Testimonial";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/testimonials/[id] - Get single testimonial
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, error: "Invalid testimonial ID format" },
        { status: 400 }
      );
    }

    const testimonial = await Testimonial.findById(id)
      .select(
        "name designation college testimonial rating avatar image isPublished isFeatured publishedAt status displayOrder createdAt updatedAt"
      )
      .lean({ virtuals: true });

    if (!testimonial) {
      return NextResponse.json(
        { success: false, error: "Testimonial not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: testimonial,
    });
  } catch (error) {
    console.error("Error fetching testimonial:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch testimonial" },
      { status: 500 }
    );
  }
});

// PUT /api/testimonials/[id] - Update testimonial
export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, error: "Invalid testimonial ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (
      !body.name ||
      !body.designation ||
      !body.college ||
      !body.testimonial ||
      !body.avatar
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Name, designation, college, testimonial, and avatar are required",
        },
        { status: 400 }
      );
    }

    const updatedTestimonial = await Testimonial.findByIdAndUpdate(
      id,
      {
        name: body.name,
        designation: body.designation,
        college: body.college,
        testimonial: body.testimonial,
        rating: body.rating || 5,
        avatar: body.avatar,
        image: body.image || null,
        isPublished: body.isPublished || false,
        isFeatured: body.isFeatured || false,
        status: body.status || "draft",
        displayOrder: body.displayOrder || 0,
      },
      { new: true, runValidators: true }
    );

    if (!updatedTestimonial) {
      return NextResponse.json(
        { success: false, error: "Testimonial not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Testimonial updated successfully",
      data: {
        id: updatedTestimonial._id,
        name: updatedTestimonial.name,
        designation: updatedTestimonial.designation,
        status: updatedTestimonial.status,
      },
    });
  } catch (error) {
    console.error("Error updating testimonial:", error);

    // Handle validation errors
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
      { success: false, error: "Failed to update testimonial" },
      { status: 500 }
    );
  }
});

// DELETE /api/testimonials/[id] - Delete testimonial
export const DELETE = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, error: "Invalid testimonial ID format" },
        { status: 400 }
      );
    }

    const deletedTestimonial = await Testimonial.findByIdAndDelete(id);

    if (!deletedTestimonial) {
      return NextResponse.json(
        { success: false, error: "Testimonial not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Testimonial deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete testimonial" },
      { status: 500 }
    );
  }
});
