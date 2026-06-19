import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Stream from "@/lib/models/Stream";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/streams - Get all streams with pagination and filters
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const all = searchParams.get("all");

    // If all parameter is present, return all streams without pagination
    if (all) {
      console.log("🔍 Fetching all streams (no status filter)");

      // First, let's see all streams regardless of status
      const allStreams = await Stream.find({}).lean();
      console.log("📊 All streams in DB:", allStreams.length);
      console.log("📊 All streams data:", allStreams);

      // Now filter by Active status
      const streams = await Stream.find({ status: "Active" })
        .sort({ name: 1 })
        .lean();

      console.log("📊 Active streams found:", streams.length);
      console.log("📊 Active streams data:", streams);

      return NextResponse.json({
        success: true,
        data: streams,
      });
    }

    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    if (search) {
      // Use regex search instead of text search for better compatibility
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { about: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    // Get total count
    const total = await Stream.countDocuments(filter);

    // Get streams with pagination
    const streams = await Stream.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: streams,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching streams:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch streams" },
      { status: 500 }
    );
  }
}

// POST /api/streams - Create a new stream (Admin only)
export const POST = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    const requiredFields = ["name", "about"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Create new stream
    const stream = new Stream(body);
    await stream.save();

    return NextResponse.json(
      {
        success: true,
        message: "Stream created successfully",
        data: stream,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating stream:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Stream with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create stream" },
      { status: 500 }
    );
  }
});
