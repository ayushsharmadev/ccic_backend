import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Testimonial from "@/lib/models/Testimonial";

// GET /api/public/testimonials - Get published testimonials for public display
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 8;
    const featured = searchParams.get("featured") || "";
    const count = searchParams.get("count") || "";
    const video = searchParams.get("video") || "";

    const filter = {
      status: "published",
    };

    if (featured === "true") {
      filter.isFeatured = true;
    }

    if (video === "true") {
      filter.videoType = { $in: ["local", "external"] };
    }

    // If count is requested, return total count
    if (count === "true") {
      const totalCount = await Testimonial.countDocuments(filter);

      return NextResponse.json({
        success: true,
        data: { totalCount },
      });
    }

    // Get testimonials
    const testimonials = await Testimonial.find(filter)
      .select(
        "name designation college testimonial rating avatar image videoUrl videoType"
      )
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(limit)
      .lean({ virtuals: true });
    const publicTestimonials = testimonials.map((testimonial) => ({
      ...testimonial,
      videoType:
        testimonial.videoType === "local"
          ? "hosted"
          : testimonial.videoType,
    }));

    return NextResponse.json({
      success: true,
      data: { testimonials: publicTestimonials },
    });
  } catch (error) {
    console.error("Error fetching public testimonials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}
