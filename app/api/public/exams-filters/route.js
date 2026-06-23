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

    // Get Streams with exam counts
    if (type === "all" || type === "streams") {
      const streams = await Stream.find({
        status: "Active",
        ...(search && { name: { $regex: search, $options: "i" } }),
      })
        .select("name")
        .lean();

      const streamsWithCounts = await Promise.all(
        streams.map(async (stream) => {
          const count = await Exam.countDocuments({
            stream: stream._id,
            status: "active",
          });
          return {
            name: stream.name,
            count,
            id: stream._id.toString(),
            value: stream._id.toString(),
            label: stream.name,
          };
        })
      );

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

      const examLevelsWithCounts = await Promise.all(
        examLevels.map(async (level) => {
          const count = await Exam.countDocuments({
            examLevel: level._id,
            status: "active",
          });
          return {
            name: level.name,
            count,
            id: level._id.toString(),
            value: level._id.toString(),
            label: level.name,
          };
        })
      );

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

      const countriesWithCounts = await Promise.all(
        countries.map(async (country) => {
          const count = await Exam.countDocuments({
            country: country._id,
            status: "active",
          });
          return {
            name: country.name,
            code: country.code,
            count,
            id: country._id.toString(),
            value: country._id.toString(),
            label: country.name,
          };
        })
      );

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
