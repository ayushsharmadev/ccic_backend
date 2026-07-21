import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import {
  College,
  Country,
  State,
  Ownership,
  Exam,
  Course,
} from "@/lib/models";
import CollegeCourseAllocation from "@/lib/models/CollegeCourseAllocation";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const country = searchParams.get("country") || "";
    const type = searchParams.get("type") || "all";

    const results = {};

    // 1. O(1) Aggregation for Basic Geography & Ownership
    let collegeCounts = [
      { byCountry: [], byState: [], byOwnership: [] },
    ];
    
    const baseCollegeMatch = { status: "active" };
    const scopedCollegeMatch = { ...baseCollegeMatch };
    if (country) {
      scopedCollegeMatch.country = country;
    }

    if (["all", "countries", "states", "ownership"].includes(type)) {
      collegeCounts = await College.aggregate([
        {
          $facet: {
            byCountry: [{ $match: baseCollegeMatch }, { $group: { _id: "$country", count: { $sum: 1 } } }],
            byState: [{ $match: scopedCollegeMatch }, { $group: { _id: "$state", count: { $sum: 1 } } }],
            byOwnership: [{ $match: scopedCollegeMatch }, { $group: { _id: "$ownership", count: { $sum: 1 } } }],
          },
        },
      ]);
    }

    const countMaps = {
      countries: new Map((collegeCounts[0]?.byCountry || []).filter((c) => c._id).map((c) => [c._id.toString(), c.count])),
      states: new Map((collegeCounts[0]?.byState || []).filter((c) => c._id).map((c) => [c._id.toString(), c.count])),
      ownership: new Map((collegeCounts[0]?.byOwnership || []).filter((c) => c._id).map((c) => [c._id.toString(), c.count])),
    };

    // 2. O(1) Aggregation for Courses. Fee ranges stay static.
    let allocationCounts = [{ byCourse: [] }];
    if (["all", "exams", "courses"].includes(type)) {
      const validColleges = await College.find(scopedCollegeMatch).select("_id").lean();
      const validCollegeIds = validColleges.map((c) => c._id);

      allocationCounts = await CollegeCourseAllocation.aggregate([
        { $match: { college: { $in: validCollegeIds }, "assignedCourses.isActive": true } },
        { $unwind: "$assignedCourses" },
        { $match: { "assignedCourses.isActive": true } },
        {
          $facet: {
            byCourse: [
              { $match: { "assignedCourses.course": { $exists: true, $ne: null } } },
              { $group: { _id: { college: "$college", course: "$assignedCourses.course" } } },
              { $group: { _id: "$_id.course", count: { $sum: 1 } } },
            ],
          },
        },
      ]);
    }

    const allocMaps = {
      courses: new Map((allocationCounts[0]?.byCourse || []).filter((c) => c._id).map((c) => [c._id.toString(), c.count])),
    };

    // --- Build Responses ---

    // Get Countries
    if (type === "all" || type === "countries") {
      const countries = await Country.find({
        status: "active",
        ...(search && { $or: [{ name: { $regex: search, $options: "i" } }, { code: { $regex: search, $options: "i" } }] }),
      }).select("name code").lean();

      results.countries = countries.map((c) => ({
        name: c.name, code: c.code, value: c._id.toString(), id: c._id.toString(),
        count: countMaps.countries.get(c._id.toString()) || 0,
      })).filter((c) => c.count > 0).sort((a, b) => b.count - a.count);
    }

    // Get States
    if (type === "all" || type === "states") {
      const stateIds = Array.from(countMaps.states.keys());
      const stateFilter = {
        _id: { $in: stateIds },
        status: "active",
        ...(search && { $or: [{ name: { $regex: search, $options: "i" } }, { code: { $regex: search, $options: "i" } }] }),
      };
      if (country) stateFilter.country = country;

      const states = await State.find(stateFilter).select("name code country").sort({ name: 1 }).lean();

      results.states = states.map((s) => ({
        name: s.name, code: s.code, value: s._id.toString(), id: s._id.toString(),
        count: countMaps.states.get(s._id.toString()) || 0,
      })).filter((s) => s.count > 0).sort((a, b) => b.count - a.count);
    }

    // Get Ownership
    if (type === "all" || type === "ownership") {
      const ownershipTypes = await Ownership.find({
        status: "active", ...(search && { name: { $regex: search, $options: "i" } }),
      }).select("name").lean();

      results.ownership = ownershipTypes.map((o) => ({
        name: o.name, id: `ownership-${o._id}`, count: countMaps.ownership.get(o._id.toString()) || 0,
      })).filter((o) => o.count > 0).sort((a, b) => b.count - a.count);
    }

    // Get Exams (Mapped via Course)
    if (type === "all" || type === "exams") {
      const activeCourseIds = Array.from(allocMaps.courses.keys());
      const activeCourseObjectIds = activeCourseIds.map((id) => {
        try {
          return new mongoose.Types.ObjectId(id);
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      const exams = await Exam.find({
        status: "active",
        courseName: { $in: activeCourseObjectIds },
        ...(search && { title: { $regex: search, $options: "i" } }),
      }).select("title courseName").lean();

      results.exams = exams.map((e) => {
        const count = e.courseName ? (allocMaps.courses.get(e.courseName.toString()) || 0) : 0;
        return {
          name: e.title,
          value: e._id.toString(),
          id: e._id.toString(),
          count: count,
        };
      }).filter(e => e.count > 0).sort((a, b) => b.count - a.count).slice(0, 10);
    }

    // Get Courses
    if (type === "all" || type === "courses") {
      const courses = await Course.find({
        status: "active", ...(search && { name: { $regex: search, $options: "i" } }),
      }).populate("streamId", "name").select("name streamId").lean();

      results.courses = courses.map((c) => ({
        name: c.name, value: c._id.toString(), id: c._id.toString(), stream: c.streamId?.name,
        count: allocMaps.courses.get(c._id.toString()) || 0,
      })).filter((c) => c.count > 0).sort((a, b) => b.count - a.count).slice(0, 15);
    }

    if (type === "all" || type === "feeRanges") {
      const feeRanges = [
        { name: "Upto 3 Lakh", value: "0-300000" },
        { name: "Upto 5 Lakh", value: "0-500000" },
        { name: "Upto 10 Lakh", value: "0-1000000" },
        { name: "Above 10 Lakh", value: "1000000-Infinity" },
      ];

      results.feeRanges = feeRanges.map((range) => ({
        name: range.name,
        value: range.value,
        id: range.value,
      }));
    }

    // Sort Options
    if (type === "all" || type === "sortOptions") {
      results.sortOptions = [
        { name: "Alphabetically", id: "sort-1" },
        { name: "Popularity", id: "sort-2" },
        { name: "Lowest To Highest Fees", id: "sort-3" },
      ];
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Error fetching colleges filters:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch colleges filters", message: error.message },
      { status: 500 },
    );
  }
}
