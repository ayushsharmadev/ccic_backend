import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import State from "@/lib/models/State";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "active";
    const country = searchParams.get("country") || "";

    let query = { status: status };

    if (country) {
      query.country = country;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    // Fetch states
    const states = await State.find(query)
      .populate("country", "name code")
      .select("name code logo status country")
      .sort({ name: 1 })
      .lean();

    // Transform data for frontend
    const transformedStates = states.map((state) => ({
      id: state._id,
      value: state._id.toString(),
      label: state.name,
      code: state.code,
      logo: state.logo,
      status: state.status,
      country: state.country
        ? {
            id: state.country._id,
            name: state.country.name,
            code: state.country.code,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: transformedStates,
      count: transformedStates.length,
    });
  } catch (error) {
    console.error("Error fetching states:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch states" },
      { status: 500 }
    );
  }
}
