import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CollegeReview from "@/lib/models/CollegeReview";
import { withAdminAuth } from "@/lib/middleware/auth";
import mongoose from "mongoose";

export const POST = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    const { name, mobile, email, comment } = body;

    if (!name || !comment) {
      return NextResponse.json(
        { success: false, error: "Name and comment are required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid review ID" },
        { status: 400 }
      );
    }

    const review = await CollegeReview.findById(id);
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

    const populatedReview = await CollegeReview.findById(review._id)
      .populate("college", "name slug")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Reply added successfully",
      data: populatedReview,
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
      { success: false, error: "Failed to add reply" },
      { status: 500 }
    );
  }
});

