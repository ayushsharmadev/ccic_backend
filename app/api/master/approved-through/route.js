import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ApprovedThrough from "@/lib/models/ApprovedThrough";

// GET /api/master/approved-through - Get all approval authorities with pagination and filters
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const all = searchParams.get("all");

    // If all parameter is present, return all approval authorities without pagination
    if (all) {
      const approvalAuthorities = await ApprovedThrough.find({
        status: "active",
      })
        .sort({ name: 1 })
        .lean();

      return NextResponse.json({
        success: true,
        data: approvalAuthorities,
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
    const total = await ApprovedThrough.countDocuments(filter);

    // Get approval authorities with pagination
    const approvalAuthorities = await ApprovedThrough.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: approvalAuthorities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching approval authorities:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch approval authorities" },
      { status: 500 }
    );
  }
}

// POST /api/master/approved-through - Create a new approval authority
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

    // Create new approval authority
    const approvalAuthority = new ApprovedThrough(body);
    await approvalAuthority.save();

    return NextResponse.json(
      {
        success: true,
        message: "Approval authority created successfully",
        data: approvalAuthority,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating approval authority:", error);

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
          error: "Approval authority with this name already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create approval authority" },
      { status: 500 }
    );
  }
}
