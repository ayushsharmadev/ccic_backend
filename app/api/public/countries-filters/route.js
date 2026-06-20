import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Country } from "@/lib/models";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all"; // all, feeRanges, teachingMediums, durations, sortOptions

    const results = {};

    // Get Fee Ranges
    if (type === "all" || type === "feeRanges") {
      const feeRanges = [
        { name: "Upto 15 Lakhs", minFee: 0, maxFee: 1500000, value: "0-1500000" },
        { name: "15 - 25 Lakhs", minFee: 1500000, maxFee: 2500000, value: "1500000-2500000" },
        { name: "Above 25 Lakhs", minFee: 2500000, maxFee: Infinity, value: "2500000-Infinity" },
      ];

      const allCountries = await Country.find({ status: "active" })
        .select("studyMetrics")
        .lean();

      const feeRangesWithCounts = feeRanges.map((range) => {
        let count = 0;
        allCountries.forEach((country) => {
          const min = country.studyMetrics?.tuitionFeeMin || 0;
          const max = country.studyMetrics?.tuitionFeeMax || 0;

          // Check if any part of the country's fee range falls into this filter's range
          if ((min >= range.minFee && min <= range.maxFee) ||
            (max >= range.minFee && max <= range.maxFee) ||
            (min <= range.minFee && max >= range.maxFee)) {
            count++;
          }
        });

        return {
          name: range.name,
          count,
          value: range.value,
          id: range.value,
        };
      });

      results.feeRanges = feeRangesWithCounts;
    }

    // Get Medium of Teaching
    if (type === "all" || type === "teachingMediums") {
      const allMediums = await Country.distinct("studyMetrics.mediumOfTeaching", {
        status: "active",
        "studyMetrics.mediumOfTeaching": { $exists: true, $ne: "" }
      });

      const mediumsWithCounts = await Promise.all(
        allMediums.map(async (medium) => {
          const count = await Country.countDocuments({
            status: "active",
            "studyMetrics.mediumOfTeaching": medium
          });
          return {
            name: medium,
            count,
            value: medium,
            id: medium
          };
        })
      );

      results.teachingMediums = mediumsWithCounts.sort((a, b) => b.count - a.count);
    }

    // Get Durations
    if (type === "all" || type === "durations") {
      const allDurations = await Country.distinct("studyMetrics.courseDuration", {
        status: "active",
        "studyMetrics.courseDuration": { $exists: true, $ne: "" }
      });

      const durationsWithCounts = await Promise.all(
        allDurations.map(async (duration) => {
          const count = await Country.countDocuments({
            status: "active",
            "studyMetrics.courseDuration": duration
          });
          return {
            name: duration,
            count,
            value: duration,
            id: duration
          };
        })
      );

      results.durations = durationsWithCounts.sort((a, b) => b.count - a.count);
    }

    // Get Sort Options
    if (type === "all" || type === "sortOptions") {
      results.sortOptions = [
        { name: "Alphabetically", id: "sort-1" },
        { name: "Popularity", id: "sort-2" },
        { name: "Lowest To Highest Fees", id: "sort-3" },
      ];
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching countries filters:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch countries filters",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
