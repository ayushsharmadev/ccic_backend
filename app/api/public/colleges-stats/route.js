import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { College, State, District, Ownership, Country } from "@/lib/models";
import {
  applyDirectLocationFilters,
  buildDistrictScopeFilter,
  buildStateScopeFilter,
} from "@/lib/locationFilters";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";
    const country = searchParams.get("country") || "";
    const state = searchParams.get("state") || "";

    const collegeFilter = { status: "active" };
    applyDirectLocationFilters(collegeFilter, { country, state });

    const results = {};

    if (type === "all" || type === "total") {
      results.totalColleges = await College.countDocuments(collegeFilter);
    }

    if (type === "all" || type === "featured") {
      results.featuredColleges = await College.countDocuments({
        ...collegeFilter,
        isFeatured: true,
      });
    }

    if (type === "all" || type === "popular") {
      results.popularColleges = await College.countDocuments({
        ...collegeFilter,
        isPopular: true,
      });
    }

    if (type === "all" || type === "byCountry") {
      const countryFilter = { status: "active" };
      const countries = await Country.find(countryFilter).select("name code").lean();

      const collegesByCountry = await Promise.all(
        countries.map(async (item) => {
          const count = await College.countDocuments({
            country: item._id,
            status: "active",
          });
          return {
            country: item.name,
            code: item.code,
            count,
          };
        })
      );

      results.collegesByCountry = collegesByCountry
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count);
    }

    if (type === "all" || type === "byState") {
      const stateFilter = await buildStateScopeFilter({ country });
      const states = await State.find(stateFilter).select("name").lean();

      const collegesByState = await Promise.all(
        states.map(async (item) => {
          const count = await College.countDocuments({
            ...collegeFilter,
            state: item._id,
          });
          return {
            state: item.name,
            count,
          };
        })
      );

      results.collegesByState = collegesByState
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count);
    }

    if (type === "all" || type === "byOwnership") {
      const ownershipTypes = await Ownership.find({ status: "active" })
        .select("name")
        .lean();

      const collegesByOwnership = await Promise.all(
        ownershipTypes.map(async (ownership) => {
          const count = await College.countDocuments({
            ...collegeFilter,
            ownership: ownership._id,
          });
          return {
            ownership: ownership.name,
            count,
          };
        })
      );

      results.collegesByOwnership = collegesByOwnership
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count);
    }

    if (type === "all" || type === "topCities") {
      const districtFilter = await buildDistrictScopeFilter({ country, state });
      const districts = await District.find(districtFilter)
        .populate("state", "name")
        .select("name state")
        .lean();

      const topCities = await Promise.all(
        districts.map(async (district) => {
          const count = await College.countDocuments({
            ...collegeFilter,
            district: district._id,
          });
          return {
            city: district.name,
            state: district.state?.name,
            count,
          };
        })
      );

      results.topCities = topCities
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...results,
        filters: {
          country: country || null,
          state: state || null,
          type,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching colleges statistics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch colleges statistics",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
