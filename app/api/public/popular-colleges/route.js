import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { College } from "@/lib/models";
import { applyDirectLocationFilters } from "@/lib/locationFilters";

// Disable caching for popular colleges
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 6;
    const country = searchParams.get("country") || "";
    const state = searchParams.get("state") || "";
    const district = searchParams.get("district") || "";

    const filter = { status: "active", isPopular: true };
    applyDirectLocationFilters(filter, { country, state, district });

    const colleges = await College.find(filter)
      .populate("country", "name code")
      .populate("district", "name")
      .populate("state", "name")
      .populate("ownership", "name")
      .populate("affiliation", "name")
      .select(
        "name popularName shortName location shortDescription district state ownership slug phoneNumber estdYear campusSize affiliation isFeatured logo banner"
      )
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(limit)
      .lean();

    const response = NextResponse.json({
      success: true,
      data: {
        colleges,
        filters: {
          country: country || null,
          state: state || null,
          district: district || null,
          limit,
        },
      },
    });

    // Set cache-control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error("Error fetching popular colleges:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch popular colleges" },
      { status: 500 }
    );
  }
};
