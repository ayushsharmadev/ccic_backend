import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CollegeReview from "@/lib/models/CollegeReview";
import College from "@/lib/models/College";
import { withAdminAuth } from "@/lib/middleware/auth";
import mongoose from "mongoose";

const calculateCollegeRating = async (collegeId) => {
  const stats = await CollegeReview.aggregate([
    {
      $match: {
        college: new mongoose.Types.ObjectId(collegeId),
        status: "approved",
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        reviewsCount: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await College.findByIdAndUpdate(collegeId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      reviewsCount: stats[0].reviewsCount,
    });
  } else {
    await College.findByIdAndUpdate(collegeId, {
      averageRating: 0,
      reviewsCount: 0,
    });
  }
};

export async function GET(request, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid review ID" },
        { status: 400 }
      );
    }

    const review = await CollegeReview.findById(id)
      .populate("college", "name slug")
      .lean();

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch review" },
      { status: 500 }
    );
  }
}

export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

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

    const oldStatus = review.status;
    const { status, name, rating, comment } = body;

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      review.status = status;
    }

    if (name) review.name = name.trim();
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { success: false, error: "Rating must be between 1 and 5" },
          { status: 400 }
        );
      }
      review.rating = rating;
    }
    if (comment) review.comment = comment.trim();

    await review.save();

    if (status && status !== oldStatus && status === "approved") {
      await calculateCollegeRating(review.college);
    } else if (status && oldStatus === "approved" && status !== "approved") {
      await calculateCollegeRating(review.college);
    }

    const populatedReview = await CollegeReview.findById(review._id)
      .populate("college", "name slug")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Review updated successfully",
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
      { success: false, error: "Failed to update review" },
      { status: 500 }
    );
  }
});

export const DELETE = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;

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

    const collegeId = review.college;
    const wasApproved = review.status === "approved";

    await CollegeReview.findByIdAndDelete(id);

    if (wasApproved) {
      await calculateCollegeRating(collegeId);
    }

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete review" },
      { status: 500 }
    );
  }
});

