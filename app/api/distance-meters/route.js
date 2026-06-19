import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import DistanceMeter from "@/lib/models/DistanceMeter";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/distance-meters - Get all distance meters with pagination and filters
export const GET = async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      filter.status = status;
    } else if (!all) {
      filter.status = "active";
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    let distanceMeters, totalCount;

    if (all) {
      // Get all active distance meters without pagination
      distanceMeters = await DistanceMeter.find(filter)
        .select("name shortDescription icon status createdAt updatedAt")
        .sort(sort)
        .lean();
      totalCount = distanceMeters.length;
    } else {
      const skip = (page - 1) * limit;
      [distanceMeters, totalCount] = await Promise.all([
        DistanceMeter.find(filter)
          .select("name shortDescription icon status createdAt updatedAt")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        DistanceMeter.countDocuments(filter),
      ]);
    }

    // Transform the data
    const transformedDistanceMeters = distanceMeters.map((distanceMeter) => ({
      _id: distanceMeter._id,
      id: distanceMeter._id,
      name: distanceMeter.name,
      shortDescription: distanceMeter.shortDescription || "",
      icon: distanceMeter.icon || "",
      status: distanceMeter.status,
      createdAt: distanceMeter.createdAt,
      updatedAt: distanceMeter.updatedAt,
    }));

    if (all) {
      return NextResponse.json({
        success: true,
        data: transformedDistanceMeters,
      });
    }

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: transformedDistanceMeters,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching distance meters:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch distance meters" },
      { status: 500 }
    );
  }
};

// POST /api/distance-meters - Create new distance meter
export const POST = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Distance meter name is required",
        },
        { status: 400 }
      );
    }

    // Create new distance meter
    const distanceMeter = new DistanceMeter({
      name: body.name,
      shortDescription: body.shortDescription || "",
      icon: body.icon || "",
      status: body.status || "active",
    });

    const savedDistanceMeter = await distanceMeter.save();

    return NextResponse.json({
      success: true,
      data: savedDistanceMeter,
      message: "Distance meter created successfully",
    });
  } catch (error) {
    console.error("Error creating distance meter:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Distance meter with this name already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create distance meter" },
      { status: 500 }
    );
  }
});

