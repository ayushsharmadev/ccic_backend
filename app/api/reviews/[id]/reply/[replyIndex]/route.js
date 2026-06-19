import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CollegeReview from "@/lib/models/CollegeReview";
import { withAdminAuth } from "@/lib/middleware/auth";
import mongoose from "mongoose";

export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id, replyIndex } = resolvedParams;
    const body = await request.json();

    const { status } = body;

    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Valid status is required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid review ID" },
        { status: 400 }
      );
    }

    const replyIdx = parseInt(replyIndex);
    if (isNaN(replyIdx) || replyIdx < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid reply index" },
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

    if (!review.replies || replyIdx >= review.replies.length) {
      return NextResponse.json(
        { success: false, error: "Reply not found" },
        { status: 404 }
      );
    }

    review.replies[replyIdx].status = status;
    await review.save();

    const populatedReview = await CollegeReview.findById(review._id)
      .populate("college", "name slug")
      .lean();

    return NextResponse.json({
      success: true,
      message: `Reply ${status === "approved" ? "approved" : status === "rejected" ? "rejected" : "updated"} successfully`,
      data: populatedReview,
    });
  } catch (error) {
    console.error("Error updating reply:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update reply" },
      { status: 500 }
    );
  }
});

export const DELETE = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id, replyIndex } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid review ID" },
        { status: 400 }
      );
    }

    const replyIdx = parseInt(replyIndex);
    if (isNaN(replyIdx) || replyIdx < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid reply index" },
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

    if (!review.replies || replyIdx >= review.replies.length) {
      return NextResponse.json(
        { success: false, error: "Reply not found" },
        { status: 404 }
      );
    }

    review.replies.splice(replyIdx, 1);
    await review.save();

    const populatedReview = await CollegeReview.findById(review._id)
      .populate("college", "name slug")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Reply deleted successfully",
      data: populatedReview,
    });
  } catch (error) {
    console.error("Error deleting reply:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete reply" },
      { status: 500 }
    );
  }
});

