import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Country from "@/lib/models/Country";
import { withAdminAuth } from "@/lib/middleware/auth";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const all = searchParams.get("all");

    if (all) {
      const filter = { status: "active" };
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { code: { $regex: search, $options: "i" } },
        ];
      }

      const countries = await Country.find(filter)
        .select("_id name code slug status")
        .sort({ name: 1 })
        .lean();

      return NextResponse.json({
        success: true,
        data: countries,
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

    const total = await Country.countDocuments(filter);
    const countries = await Country.find(filter)
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
    console.error("Error fetching countries:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch countries" },
      { status: 500 },
    );
  }
}

export const POST = withAdminAuth(async (request) => {
  try {
    await connectDB();
    const body = await request.json();

    const requiredFields = ["name", "code"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 },
        );
      }
    }

    const country = new Country({
      ...body,
      code: body.code.trim().toUpperCase(),
      name: body.name.trim(),
    });
    await country.save();

    return NextResponse.json(
      {
        success: true,
        message: "Country created successfully",
        data: country,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating country:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 },
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Country with this name or code already exists",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create country" },
      { status: 500 },
    );
  }
});
