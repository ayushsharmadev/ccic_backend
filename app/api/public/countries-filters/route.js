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

    // Get counts using O(1) aggregation if needed
    let countryCounts = [{ byMedium: [], byDuration: [] }];
    if (["all", "teachingMediums", "durations"].includes(type)) {
      countryCounts = await Country.aggregate([
        { $match: { status: "active" } },
        {
          $facet: {
            byMedium: [
              { $match: { "studyMetrics.mediumOfTeaching": { $exists: true, $ne: null, $ne: "" } } },
              { $group: { _id: "$studyMetrics.mediumOfTeaching", count: { $sum: 1 } } }
            ],
            byDuration: [
              { $match: { "studyMetrics.courseDuration": { $exists: true, $ne: null, $ne: "" } } },
              { $group: { _id: "$studyMetrics.courseDuration", count: { $sum: 1 } } }
            ]
          }
        }
      ]);
    }

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
      const mediumsWithCounts = (countryCounts[0]?.byMedium || []).map((medium) => ({
        name: medium._id,
        count: medium.count,
        value: medium._id,
        id: medium._id
      }));

      results.teachingMediums = mediumsWithCounts.sort((a, b) => b.count - a.count);
    }

    // Get Durations
    if (type === "all" || type === "durations") {
      const durationsWithCounts = (countryCounts[0]?.byDuration || []).map((duration) => ({
        name: duration._id,
        count: duration.count,
        value: duration._id,
        id: duration._id
      }));

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
