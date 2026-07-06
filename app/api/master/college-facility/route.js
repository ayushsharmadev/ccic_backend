import { withAdminAuth } from "@/lib/middleware/auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CollegeFacility from "@/lib/models/CollegeFacility";

// GET /api/master/college-facility - Get all college facilities with pagination and filters
export const GET = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const all = searchParams.get("all");

    // If all parameter is present, return all college facilities without pagination
    if (all) {
      const facilities = await CollegeFacility.find({ status: "active" })
        .sort({ name: 1 })
        .lean();

      return NextResponse.json({
        success: true,
        data: facilities,
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
    const total = await CollegeFacility.countDocuments(filter);

    // Get college facilities with pagination
    const facilities = await CollegeFacility.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: facilities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching college facilities:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch college facilities" },
      { status: 500 }
    );
  }
});

// POST /api/master/college-facility - Create a new college facility
export async function POST(request) {
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

    // Create new college facility
    const facility = new CollegeFacility(body);
    await facility.save();

    return NextResponse.json(
      {
        success: true,
        message: "College facility created successfully",
        data: facility,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating college facility:", error);

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
          error: "College facility with this name already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create college facility" },
      { status: 500 }
    );
  }
}
