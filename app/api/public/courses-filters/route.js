import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Course, Stream, Degree } from "@/lib/models";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all"; // all, streams, degrees, feeRanges

    const results = {};

    // Fetch counts using O(1) aggregation if needed
    let courseCounts = [{ byStream: [], byDegree: [] }];
    if (["all", "streams", "degrees"].includes(type)) {
      courseCounts = await Course.aggregate([
        { $match: { status: "active" } },
        {
          $facet: {
            byStream: [
              { $match: { streamId: { $exists: true, $ne: null } } },
              { $group: { _id: "$streamId", count: { $sum: 1 } } }
            ],
            byDegree: [
              { $match: { degreeId: { $exists: true, $ne: null } } },
              { $group: { _id: "$degreeId", count: { $sum: 1 } } }
            ]
          }
        }
      ]);
    }

    const countMaps = {
      streams: new Map(
        (courseCounts[0]?.byStream || [])
          .filter((c) => c._id)
          .map((c) => [c._id.toString(), c.count])
      ),
      degrees: new Map(
        (courseCounts[0]?.byDegree || [])
          .filter((c) => c._id)
          .map((c) => [c._id.toString(), c.count])
      ),
    };

    // Get Streams with course counts
    if (type === "all" || type === "streams") {
      const streams = await Stream.find({
        status: "Active",
        ...(search && { name: { $regex: search, $options: "i" } }),
      })
        .select("name logo about")
        .lean();

      const streamsWithCounts = streams.map((stream) => ({
        name: stream.name,
        logo: stream.logo,
        about: stream.about,
        count: countMaps.streams.get(stream._id.toString()) || 0,
        id: `stream-${stream._id}`,
      }));

      results.streams = streamsWithCounts
        .filter((stream) => stream.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // Limit to top 20 streams
    }

    // Get Degrees with course counts
    if (type === "all" || type === "degrees") {
      const degrees = await Degree.find({
        status: "active",
        ...(search && { name: { $regex: search, $options: "i" } }),
      })
        .select("name")
        .lean();

      const degreesWithCounts = degrees.map((degree) => ({
        name: degree.name,
        count: countMaps.degrees.get(degree._id.toString()) || 0,
        id: `degree-${degree._id}`,
      }));

      results.degrees = degreesWithCounts
        .filter((degree) => degree.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // Limit to top 20 degrees
    }

    // Get Fee Ranges with course counts
    if (type === "all" || type === "feeRanges") {
      const feeRanges = [
        { name: "Below ₹1 Lac", id: "fee-1", value: "below-1lac" },
        { name: "₹1 Lac - ₹2 Lac", id: "fee-2", value: "1lac-2lac" },
        { name: "₹2 Lac - ₹5 Lac", id: "fee-3", value: "2lac-5lac" },
        { name: "₹5 Lac - ₹10 Lac", id: "fee-4", value: "5lac-10lac" },
        { name: "Above ₹10 Lac", id: "fee-5", value: "above-10lac" },
      ];

      // Note: Fee range counting would require parsing averageFee strings
      // For now, we'll return all ranges with placeholder counts
      const feeRangesWithCounts = feeRanges.map((range) => ({
        ...range,
        count: 0, // This would need implementation based on actual fee parsing
      }));

      results.feeRanges = feeRangesWithCounts;
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
    console.error("Error fetching courses filters:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch courses filters",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
