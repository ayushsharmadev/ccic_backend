import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CollegeReview from "@/lib/models/CollegeReview";
import College from "@/lib/models/College";
import { withAdminAuth } from "@/lib/middleware/auth";
import mongoose from "mongoose";

export const GET = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const collegeId = searchParams.get("college");
    const status = searchParams.get("status");
    const rating = searchParams.get("rating");
    const skip = (page - 1) * limit;

    const query = {};

    if (collegeId && mongoose.Types.ObjectId.isValid(collegeId)) {
      query.college = new mongoose.Types.ObjectId(collegeId);
    }

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }

    if (rating) {
      const ratingNum = parseInt(rating);
      if (ratingNum >= 1 && ratingNum <= 5) {
        query.rating = ratingNum;
      }
    }

    const [reviews, total] = await Promise.all([
      CollegeReview.find(query)
        .populate("college", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CollegeReview.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: reviews,
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
});

export const POST = async (request) => {
  try {
    await connectDB();

    const body = await request.json();
    const { college, name, mobile, email, rating, comment } = body;

    if (!college || !name || !rating || !comment) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(college)) {
      return NextResponse.json(
        { success: false, error: "Invalid college ID" },
        { status: 400 }
      );
    }

    const collegeExists = await College.findById(college);
    if (!collegeExists) {
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
      college,
      name,
      mobile: mobile?.trim() || undefined,
      email: email?.trim() || undefined,
      rating,
      comment: comment.trim(),
      status: "pending",
    });

    await review.save();

    const populatedReview = await CollegeReview.findById(review._id)
      .populate("college", "name slug")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully. It will be visible after admin approval.",
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
      { success: false, error: "Failed to create review" },
      { status: 500 }
    );
  }
};

