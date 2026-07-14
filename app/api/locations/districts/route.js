import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import District from "@/lib/models/District";
import State from "@/lib/models/State";
import Country from "@/lib/models/Country";
import CountryMaster from "@/lib/models/CountryMaster";
import { withAdminAuth } from "@/lib/middleware/auth";

/**
 * Bridge lookup: resolves Country(abroad) _id → CountryMaster _id by name match.
 * Falls back gracefully if the _id is already a CountryMaster _id.
 */
async function resolveCountryMasterId(countryId) {
  if (!countryId) return null;
  const cm = await CountryMaster.findById(countryId).select("_id").lean();
  if (cm) return cm._id;
  const abroad = await Country.findById(countryId).select("name").lean();
  if (!abroad) return countryId;
  const cmByName = await CountryMaster.findOne({ name: abroad.name }).select("_id").lean();
  return cmByName ? cmByName._id : null;
}

// GET /api/locations/districts - Get all districts with pagination and filters
export const GET = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const state = searchParams.get("state") || "";
    const country = searchParams.get("country") || "";
    const status = searchParams.get("status") || "";
    const all = searchParams.get("all");

    // If all parameter is present, return all districts without pagination
    if (all) {
      if (!state && !country && !search) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      const filter = { status: "active" };
      if (state) {
        filter.state = state;
      } else if (country) {
        const cmId = await resolveCountryMasterId(country);
        if (cmId) {
          const states = await State.find({ country: cmId, status: "active" })
            .select("_id")
            .lean();
          filter.state = { $in: states.map((item) => item._id) };
        }
      }

      const districts = await District.find(filter)
        .populate({
          path: "state",
          select: "name code country",
          populate: { path: "country", select: "name code", model: "CountryMaster" },
        })
        .select("_id name code state status")
        .sort({ name: 1 })
        .lean();

      return NextResponse.json({
        success: true,
        data: districts,
      });
    }

    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    if (search) {
      const matchingStates = await State.find({
        name: { $regex: search, $options: "i" },
      })
        .select("_id")
        .lean();

      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        ...(matchingStates.length
          ? [{ state: { $in: matchingStates.map((item) => item._id) } }]
          : []),
      ];
    }

    if (state) {
      filter.state = state;
    } else if (country) {
      const cmId = await resolveCountryMasterId(country);
      if (cmId) {
        const states = await State.find({ country: cmId, status: "active" })
          .select("_id")
          .lean();
        filter.state = { $in: states.map((item) => item._id) };
      }
    }

    if (status) {
      filter.status = status;
    }

    // Get total count
    const total = await District.countDocuments(filter);

    // Get districts with pagination
    const districts = await District.find(filter)
      .populate({
        path: "state",
        select: "name code country",
        populate: { path: "country", select: "name code", model: "CountryMaster" },
      })
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: districts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching districts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch districts" },
      { status: 500 }
    );
  }
});

// POST /api/locations/districts - Create a new district (Admin only)
export const POST = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    const requiredFields = ["name", "state"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Create new district
    const district = new District(body);
    await district.save();

    // Populate state reference for response
    const populatedDistrict = await District.findById(district._id)
      .populate("state", "name code")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "District created successfully",
        data: populatedDistrict,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating district:", error);

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
          error: "District with this name already exists in the selected state",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create district" },
      { status: 500 }
    );
  }
});
