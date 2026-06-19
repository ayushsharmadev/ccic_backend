import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CollegeReview from "@/lib/models/CollegeReview";
import College from "@/lib/models/College";
import mongoose from "mongoose";

export async function POST(request, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { collegeSlug } = resolvedParams;
    const body = await request.json();

    const { reviewId, name, mobile, email, comment } = body;

    if (!reviewId || !name || !comment) {
      return NextResponse.json(
        { success: false, error: "Review ID, name and comment are required" },
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

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json(
        { success: false, error: "Invalid review ID" },
        { status: 400 }
      );
    }

    const review = await CollegeReview.findOne({
      _id: reviewId,
      college: college._id,
      status: "approved",
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    review.replies.push({
      name: name.trim(),
      mobile: mobile?.trim() || undefined,
      email: email?.trim() || undefined,
      comment: comment.trim(),
      status: "pending",
    });

    await review.save();

    return NextResponse.json({
      success: true,
      message: "Reply submitted successfully. It will be visible after admin approval.",
      data: {
        _id: review._id,
        replies: review.replies,
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
      { success: false, error: error.message || "Failed to submit reply" },
      { status: 500 }
    );
  }
}

