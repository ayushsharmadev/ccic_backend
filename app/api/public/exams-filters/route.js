import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Exam, Stream, ExamLevel, Country } from "@/lib/models";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all"; // all, streams, examLevels, countries

    const results = {};

    // Fetch counts using O(1) aggregation if needed
    let examCounts = [{ byStream: [], byExamLevel: [], byCountry: [] }];
    if (["all", "streams", "examLevels", "countries"].includes(type)) {
      examCounts = await Exam.aggregate([
        { $match: { status: "active" } },
        {
          $facet: {
            byStream: [
              { $match: { stream: { $exists: true, $ne: null } } },
              { $group: { _id: "$stream", count: { $sum: 1 } } }
            ],
            byExamLevel: [
              { $match: { examLevel: { $exists: true, $ne: null } } },
              { $group: { _id: "$examLevel", count: { $sum: 1 } } }
            ],
            byCountry: [
              { $match: { country: { $exists: true, $ne: null } } },
              { $group: { _id: "$country", count: { $sum: 1 } } }
            ]
          }
        }
      ]);
    }

    const countMaps = {
      streams: new Map(
        (examCounts[0]?.byStream || [])
          .filter((c) => c._id)
          .map((c) => [c._id.toString(), c.count])
      ),
      examLevels: new Map(
        (examCounts[0]?.byExamLevel || [])
          .filter((c) => c._id)
          .map((c) => [c._id.toString(), c.count])
      ),
      countries: new Map(
        (examCounts[0]?.byCountry || [])
          .filter((c) => c._id)
          .map((c) => [c._id.toString(), c.count])
      ),
    };

    // Get Streams with exam counts
    if (type === "all" || type === "streams") {
      const streams = await Stream.find({
        status: "Active",
        ...(search && { name: { $regex: search, $options: "i" } }),
      })
        .select("name")
        .lean();

      const streamsWithCounts = streams.map((stream) => ({
        name: stream.name,
        count: countMaps.streams.get(stream._id.toString()) || 0,
        id: stream._id.toString(),
        value: stream._id.toString(),
        label: stream.name,
      }));

      results.streams = streamsWithCounts
        .filter((stream) => stream.count > 0)
        .sort((a, b) => b.count - a.count);
    }

    // Get Exam Levels with exam counts
    if (type === "all" || type === "examLevels") {
      const examLevels = await ExamLevel.find({
        status: "active",
        ...(search && { name: { $regex: search, $options: "i" } }),
      })
        .select("name")
        .lean();

      const examLevelsWithCounts = examLevels.map((level) => ({
        name: level.name,
        count: countMaps.examLevels.get(level._id.toString()) || 0,
        id: level._id.toString(),
        value: level._id.toString(),
        label: level.name,
      }));

      results.examLevels = examLevelsWithCounts
        .filter((level) => level.count > 0)
        .sort((a, b) => b.count - a.count);
    }

    // Get Countries with exam counts
    if (type === "all" || type === "countries") {
      const countries = await Country.find({
        status: "active",
        ...(search && { name: { $regex: search, $options: "i" } }),
      })
        .select("name code")
        .lean();

      const countriesWithCounts = countries.map((country) => ({
        name: country.name,
        code: country.code,
        count: countMaps.countries.get(country._id.toString()) || 0,
        id: country._id.toString(),
        value: country._id.toString(),
        label: country.name,
      }));

      results.countries = countriesWithCounts
        .filter((country) => country.count > 0)
        .sort((a, b) => b.count - a.count);
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching exams filters:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch exams filters",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
