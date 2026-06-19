import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CollegeReview from "@/lib/models/CollegeReview";
import College from "@/lib/models/College";

export async function GET(request, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { collegeSlug } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const college = await College.findOne({ slug: collegeSlug }).lean();
    if (!college) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    const [reviews, total] = await Promise.all([
      CollegeReview.find({
        college: college._id,
        status: "approved",
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CollegeReview.countDocuments({
        college: college._id,
        status: "approved",
      }),
    ]);

    // Filter only approved replies
    const reviewsWithApprovedReplies = reviews.map((review) => ({
      ...review,
      replies: (review.replies || []).filter(
        (reply) => reply.status === "approved"
      ),
    }));

    return NextResponse.json({
      success: true,
      data: reviewsWithApprovedReplies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { collegeSlug } = resolvedParams;
    const body = await request.json();

    const { name, mobile, email, rating, comment } = body;

    if (!name || !rating || !comment) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const college = await College.findOne({ slug: collegeSlug });
    if (!college) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const review = new CollegeReview({
      college: college._id,
      name: name.trim(),
      mobile: mobile?.trim() || undefined,
      email: email?.trim() || undefined,
      rating,
      comment: comment.trim(),
      status: "pending",
    });

    await review.save();

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully. It will be visible after admin approval.",
      data: {
        _id: review._id,
        name: review.name,
        rating: review.rating,
        comment: review.comment,
        status: review.status,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors || {}).map(
        (err) => err.message
      );
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to submit review" },
      { status: 500 }
    );
  }
}

