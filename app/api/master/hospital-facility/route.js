import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import HospitalFacility from "@/lib/models/HospitalFacility";

// GET /api/master/hospital-facility - Get all hospital facilities with pagination and filters
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const all = searchParams.get("all");

    // If all parameter is present, return all hospital facilities without pagination
    if (all) {
      const facilities = await HospitalFacility.find({ status: "active" })
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
    const total = await HospitalFacility.countDocuments(filter);

    // Get hospital facilities with pagination
    const facilities = await HospitalFacility.find(filter)
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
    console.error("Error fetching hospital facilities:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch hospital facilities" },
      { status: 500 }
    );
  }
}

// POST /api/master/hospital-facility - Create a new hospital facility
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

    // Create new hospital facility
    const facility = new HospitalFacility(body);
    await facility.save();

    return NextResponse.json(
      {
        success: true,
        message: "Hospital facility created successfully",
        data: facility,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating hospital facility:", error);

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
          error: "Hospital facility with this name already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create hospital facility" },
      { status: 500 }
    );
  }
}
