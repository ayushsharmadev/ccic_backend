import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Country from "@/lib/models/Country";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "active";

    const query = { status };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const countries = await Country.find(query)
      .select("name code logo status")
      .sort({ name: 1 })
      .lean();

    const transformedCountries = countries.map((country) => ({
      id: country._id,
      value: country._id.toString(),
      label: country.name,
      code: country.code,
      logo: country.logo,
      status: country.status,
    }));

    return NextResponse.json({
      success: true,
      data: transformedCountries,
      count: transformedCountries.length,
    });
  } catch (error) {
    console.error("Error fetching countries:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch countries" },
      { status: 500 }
    );
  }
}
