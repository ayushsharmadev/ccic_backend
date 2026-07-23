import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Testimonial from "@/lib/models/Testimonial";
import { withAdminAuth } from "@/lib/middleware/auth";
import { isValidTestimonialVideo } from "@/lib/utils/testimonialVideo";
import { deleteLocalTestimonialVideo } from "@/lib/utils/testimonialVideoStorage";

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
        "name designation college testimonial rating avatar image videoUrl videoType isPublished isFeatured publishedAt status displayOrder createdAt updatedAt"
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

    const existingTestimonial = await Testimonial.findById(id)
      .select("publishedAt videoUrl videoType")
      .lean();

    if (!existingTestimonial) {
      return NextResponse.json(
        { success: false, error: "Testimonial not found" },
        { status: 404 }
      );
    }

    const status = body.status || "draft";
    const isPublished = status === "published";
    const videoUrl = body.videoUrl?.trim() || null;
    const videoType = videoUrl ? body.videoType : null;

    if (!isValidTestimonialVideo(videoType, videoUrl)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Select a video type and provide either an uploaded video or a valid YouTube/Vimeo link",
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
        videoUrl,
        videoType,
        isPublished,
        isFeatured: body.isFeatured || false,
        status,
        publishedAt: isPublished
          ? existingTestimonial.publishedAt || new Date()
          : null,
        displayOrder: body.displayOrder || 0,
      },
      { new: true, runValidators: true }
    );

    if (
      existingTestimonial.videoType === "local" &&
      existingTestimonial.videoUrl &&
      existingTestimonial.videoUrl !== videoUrl
    ) {
      try {
        await deleteLocalTestimonialVideo(existingTestimonial.videoUrl);
      } catch (cleanupError) {
        console.error(
          "Failed to delete replaced testimonial video:",
          cleanupError
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Testimonial updated successfully",
      data: {
        id: updatedTestimonial._id,
        name: updatedTestimonial.name,
        designation: updatedTestimonial.designation,
        status: updatedTestimonial.status,
        videoUrl: updatedTestimonial.videoUrl,
        videoType: updatedTestimonial.videoType,
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

    if (
      deletedTestimonial.videoType === "local" &&
      deletedTestimonial.videoUrl
    ) {
      try {
        await deleteLocalTestimonialVideo(deletedTestimonial.videoUrl);
      } catch (cleanupError) {
        console.error(
          "Failed to delete testimonial video:",
          cleanupError
        );
      }
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
