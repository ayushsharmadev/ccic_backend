import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Degree from "@/lib/models/Degree";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/master/degree - Get all degrees with pagination and filters
export const GET = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const all = searchParams.get("all");

    // If all parameter is present, return all degrees without pagination
    if (all) {
      const degrees = await Degree.find({ status: "active" })
        .sort({ name: 1 })
        .lean();

      return NextResponse.json({
        success: true,
        data: degrees,
      });
    }

    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    if (search) {
      // Use regex search instead of text search for better compatibility
      filter.$or = [{ name: { $regex: search, $options: "i" } }];
    }

    if (status) {
      filter.status = status;
    }

    // Get total count
    const total = await Degree.countDocuments(filter);

    // Get degrees with pagination
    const degrees = await Degree.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: degrees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching degrees:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch degrees" },
      { status: 500 }
    );
  }
});

// POST /api/master/degree - Create a new degree (Admin only)
export const POST = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    const requiredFields = ["name"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Create new degree
    const degree = new Degree(body);
    await degree.save();

    return NextResponse.json(
      {
        success: true,
        message: "Degree created successfully",
        data: degree,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating degree:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Degree with this name already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create degree" },
      { status: 500 }
    );
  }
});
