import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Testimonial from "@/lib/models/Testimonial";
import { withAdminAuth } from "@/lib/middleware/auth";
import { isValidTestimonialVideo } from "@/lib/utils/testimonialVideo";

// GET /api/testimonials - Get all testimonials with pagination and filters
export const GET = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const isFeatured = searchParams.get("isFeatured") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { designation: { $regex: search, $options: "i" } },
        { college: { $regex: search, $options: "i" } },
        { testimonial: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (isFeatured !== "") {
      filter.isFeatured = isFeatured === "true";
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get testimonials with pagination
    const [testimonials, totalCount] = await Promise.all([
      Testimonial.find(filter)
        .select(
          "name designation college testimonial rating avatar image videoUrl videoType isPublished isFeatured publishedAt status displayOrder createdAt updatedAt"
        )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      Testimonial.countDocuments(filter),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        testimonials,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit,
        },
        filters: {
          search,
          status,
          isFeatured,
          sortBy,
          sortOrder,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
});

// POST /api/testimonials - Create new testimonial
export const POST = withAdminAuth(async (request) => {
  try {
    await connectDB();

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

    // Create new testimonial
    const testimonial = new Testimonial({
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
      publishedAt: isPublished ? new Date() : null,
      displayOrder: body.displayOrder || 0,
    });

    const savedTestimonial = await testimonial.save();

    return NextResponse.json({
      success: true,
      message: "Testimonial created successfully",
      data: {
        id: savedTestimonial._id,
        name: savedTestimonial.name,
        designation: savedTestimonial.designation,
        status: savedTestimonial.status,
        videoUrl: savedTestimonial.videoUrl,
        videoType: savedTestimonial.videoType,
      },
    });
  } catch (error) {
    console.error("Error creating testimonial:", error);

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
      { success: false, error: "Failed to create testimonial" },
      { status: 500 }
    );
  }
});
