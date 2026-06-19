import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import District from "@/lib/models/District";
import State from "@/lib/models/State";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "active";
    const state = searchParams.get("state") || "";
    const country = searchParams.get("country") || "";

    const filter = { status };

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (state) {
      filter.state = state;
    } else if (country) {
      const states = await State.find({ country, status: "active" })
        .select("_id")
        .lean();
      filter.state = { $in: states.map((item) => item._id) };
    }

    const districts = await District.find(filter)
      .populate({
        path: "state",
        select: "name code country",
        populate: { path: "country", select: "name code" },
      })
      .select("name code state status")
      .sort({ name: 1 })
      .lean();

    const transformedDistricts = districts.map((district) => ({
      id: district._id,
      value: district._id.toString(),
      label: district.name,
      code: district.code,
      state: district.state
        ? {
            id: district.state._id,
            name: district.state.name,
            code: district.state.code,
          }
        : null,
      country: district.state?.country
        ? {
            id: district.state.country._id,
            name: district.state.country.name,
            code: district.state.country.code,
          }
        : null,
      status: district.status,
    }));

    return NextResponse.json({
      success: true,
      data: transformedDistricts,
      count: transformedDistricts.length,
    });
  } catch (error) {
    console.error("Error fetching districts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch districts" },
      { status: 500 }
    );
  }
}
