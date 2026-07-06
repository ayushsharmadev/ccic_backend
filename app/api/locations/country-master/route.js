import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CountryMaster from "@/lib/models/CountryMaster";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/locations/country-master
export const GET = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const all = searchParams.get("all");

    // Return all (no pagination) — for dropdowns
    if (all) {
      const filter = { status: "active" };
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { code: { $regex: search, $options: "i" } },
        ];
      }
      const countries = await CountryMaster.find(filter)
        .select("_id name code status")
        .sort({ name: 1 })
        .lean();
      return NextResponse.json({ success: true, data: countries });
    }

    // Paginated list
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

    const total = await CountryMaster.countDocuments(filter);
    const countries = await CountryMaster.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: countries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching country masters:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch countries" },
      { status: 500 }
    );
  }
});

// POST /api/locations/country-master — Admin only
export const POST = withAdminAuth(async (request) => {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.name || !body.code) {
      return NextResponse.json(
        { success: false, error: "name and code are required" },
        { status: 400 }
      );
    }

    const country = new CountryMaster({
      name: body.name.trim(),
      code: body.code.trim().toUpperCase(),
      status: body.status || "active",
    });
    await country.save();

    return NextResponse.json(
      { success: true, message: "Country created successfully", data: country },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating country master:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Country with this name or code already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create country" },
      { status: 500 }
    );
  }
});
