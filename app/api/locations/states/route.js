import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import State from "@/lib/models/State";
import Country from "@/lib/models/Country";
import CountryMaster from "@/lib/models/CountryMaster";
import { withAdminAuth } from "@/lib/middleware/auth";

/**
 * Bridge lookup: accepts either a CountryMaster _id OR a Country(abroad) _id.
 * If the _id belongs to Country(abroad), resolves to the matching CountryMaster _id by name.
 * Returns the CountryMaster _id to use in State queries.
 */
async function resolveCountryMasterId(countryId) {
  if (!countryId) return null;

  const cm = await CountryMaster.findById(countryId).select("_id").lean();
  if (cm) return cm._id;

  const abroad = await Country.findById(countryId).select("name").lean();
  if (!abroad) return countryId;

  const cmByName = await CountryMaster.findOne({ name: abroad.name })
    .select("_id")
    .lean();

  return cmByName ? cmByName._id : null;
}

// GET /api/locations/states - Get all states with pagination and filters
export const GET = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const country = searchParams.get("country") || "";
    const all = searchParams.get("all");

    if (all) {
      const filter = { status: "active" };
      if (country) {
        const cmId = await resolveCountryMasterId(country);
        if (cmId) filter.country = cmId;
      }
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { code: { $regex: search, $options: "i" } },
        ];
      }

      const states = await State.find(filter)
        .populate({ path: "country", select: "name code", model: "CountryMaster" })
        .select("_id name code country status")
        .sort({ name: 1 })
        .lean();

      return NextResponse.json({
        success: true,
        data: states,
      });
    }

    const skip = (page - 1) * limit;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (country) {
      const cmId = await resolveCountryMasterId(country);
      if (cmId) filter.country = cmId;
    }

    const total = await State.countDocuments(filter);
    const states = await State.find(filter)
      .populate({ path: "country", select: "name code", model: "CountryMaster" })
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: states,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching states:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch states" },
      { status: 500 }
    );
  }
});

// POST /api/locations/states - Create a new state (Admin only)
export const POST = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const body = await request.json();

    const requiredFields = ["name", "code", "country"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const state = new State(body);
    await state.save();

    return NextResponse.json(
      {
        success: true,
        message: "State created successfully",
        data: state,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating state:", error);

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
          error: "State with this name or code already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create state" },
      { status: 500 }
    );
  }
});
