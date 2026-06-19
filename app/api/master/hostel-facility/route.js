import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import HostelFacility from "@/lib/models/HostelFacility";

// GET /api/master/hostel-facility - Get all hostel facilities with pagination and filters
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const all = searchParams.get("all");

    // If all parameter is present, return all hostel facilities without pagination
    if (all) {
      const facilities = await HostelFacility.find({ status: "active" })
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
    const total = await HostelFacility.countDocuments(filter);

    // Get hostel facilities with pagination
    const facilities = await HostelFacility.find(filter)
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
    console.error("Error fetching hostel facilities:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch hostel facilities" },
      { status: 500 }
    );
  }
}

// POST /api/master/hostel-facility - Create a new hostel facility
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

    // Create new hostel facility
    const facility = new HostelFacility(body);
    await facility.save();

    return NextResponse.json(
      {
        success: true,
        message: "Hostel facility created successfully",
        data: facility,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating hostel facility:", error);

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
          error: "Hostel facility with this name already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create hostel facility" },
      { status: 500 }
    );
  }
}
