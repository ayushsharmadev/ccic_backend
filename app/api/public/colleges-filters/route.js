import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import {
  College,
  Country,
  District,
  State,
  Ownership,
  ExamType,
  Course,
} from "@/lib/models";
import CollegeCourseAllocation from "@/lib/models/CollegeCourseAllocation";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const country = searchParams.get("country") || "";
    const state = searchParams.get("state") || "";
    const type = searchParams.get("type") || "all";

    const results = {};

    // 1. O(1) Aggregation for Basic Geography & Ownership
    let collegeCounts = [
      { byCountry: [], byState: [], byDistrict: [], byOwnership: [] },
    ];
    if (["all", "countries", "states", "cities", "ownership"].includes(type)) {
      collegeCounts = await College.aggregate([
        { $match: { status: "active" } },
        {
          $facet: {
            byCountry: [{ $group: { _id: "$country", count: { $sum: 1 } } }],
            byState: [{ $group: { _id: "$state", count: { $sum: 1 } } }],
            byDistrict: [{ $group: { _id: "$district", count: { $sum: 1 } } }],
            byOwnership: [
              { $group: { _id: "$ownership", count: { $sum: 1 } } },
            ],
          },
        },
      ]);
    }

    const countMaps = {
      countries: new Map(
        collegeCounts[0].byCountry
          .filter((c) => c._id)
          .map((c) => [c._id.toString(), c.count]),
      ),
      states: new Map(
        collegeCounts[0].byState
          .filter((c) => c._id)
          .map((c) => [c._id.toString(), c.count]),
      ),
      districts: new Map(
        collegeCounts[0].byDistrict
          .filter((c) => c._id)
          .map((c) => [c._id.toString(), c.count]),
      ),
      ownership: new Map(
        collegeCounts[0].byOwnership
          .filter((c) => c._id)
          .map((c) => [c._id.toString(), c.count]),
      ),
    };

    // 2. O(1) Aggregation for Exams and Courses
    let allocationCounts = [{ byExam: [], byCourse: [] }];
    if (["all", "exams", "courses"].includes(type)) {
      allocationCounts = await CollegeCourseAllocation.aggregate([
        { $unwind: "$assignedCourses" },
        { $match: { "assignedCourses.isActive": true } },
        {
          $facet: {
            byExam: [
              {
                $match: {
                  "assignedCourses.examType": { $exists: true, $ne: null },
                },
              },
              {
                $group: {
                  _id: {
                    college: "$college",
                    examType: "$assignedCourses.examType",
                  },
                },
              },
              { $group: { _id: "$_id.examType", count: { $sum: 1 } } },
            ],
            byCourse: [
              {
                $match: {
                  "assignedCourses.course": { $exists: true, $ne: null },
                },
              },
              {
                $group: {
                  _id: {
                    college: "$college",
                    course: "$assignedCourses.course",
                  },
                },
              },
              { $group: { _id: "$_id.course", count: { $sum: 1 } } },
            ],
          },
        },
      ]);
    }

    const allocMaps = {
      exams: new Map(
        allocationCounts[0].byExam
          .filter((c) => c._id)
          .map((c) => [c._id.toString(), c.count]),
      ),
      courses: new Map(
        allocationCounts[0].byCourse
          .filter((c) => c._id)
          .map((c) => [c._id.toString(), c.count]),
      ),
    };

    // --- Build Responses ---

    // Get Countries
    if (type === "all" || type === "countries") {
      const countries = await Country.find({
        status: "active",
        ...(search && {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { code: { $regex: search, $options: "i" } },
          ],
        }),
      })
        .select("name code")
        .lean();

      results.countries = countries
        .map((c) => ({
          name: c.name,
          code: c.code,
          value: c._id.toString(),
          id: c._id.toString(),
          count: countMaps.countries.get(c._id.toString()) || 0,
        }))
        .filter((c) => c.count > 0)
        .sort((a, b) => b.count - a.count);
    }

    // Get States
    if (type === "all" || type === "states") {
      const stateFilter = {
        status: "active",
        ...(search && {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { code: { $regex: search, $options: "i" } },
          ],
        }),
      };
      if (country) stateFilter.country = country;

      const states = await State.find(stateFilter)
        .populate("country", "name")
        .select("name code country")
        .lean();

      results.states = states
        .map((s) => ({
          name: s.name,
          code: s.code,
          value: s._id.toString(),
          id: s._id.toString(),
          country: s.country?.name,
          count: countMaps.states.get(s._id.toString()) || 0,
        }))
        .filter((s) => s.count > 0)
        .sort((a, b) => b.count - a.count);
    }

    // Get Cities
    if (type === "all" || type === "cities") {
      const districtFilter = {
        status: "active",
        ...(search && { name: { $regex: search, $options: "i" } }),
      };
      if (state) {
        districtFilter.state = state;
      } else if (country) {
        const countryStates = await State.find({ country, status: "active" })
          .select("_id")
          .lean();
        districtFilter.state = { $in: countryStates.map((item) => item._id) };
      }

      const districts = await District.find(districtFilter)
        .populate({
          path: "state",
          select: "name country",
          populate: { path: "country", select: "name" },
        })
        .select("name state")
        .lean();

      results.cities = districts
        .map((d) => ({
          name: d.name,
          id: `city-${d._id}`,
          state: d.state?.name,
          country: d.state?.country?.name,
          count: countMaps.districts.get(d._id.toString()) || 0,
        }))
        .filter((d) => d.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    }

    // Get Ownership
    if (type === "all" || type === "ownership") {
      const ownershipTypes = await Ownership.find({
        status: "active",
        ...(search && { name: { $regex: search, $options: "i" } }),
      })
        .select("name")
        .lean();

      results.ownership = ownershipTypes
        .map((o) => ({
          name: o.name,
          id: `ownership-${o._id}`,
          count: countMaps.ownership.get(o._id.toString()) || 0,
        }))
        .filter((o) => o.count > 0)
        .sort((a, b) => b.count - a.count);
    }

    // Get Exams
    if (type === "all" || type === "exams") {
      const examTypes = await ExamType.find({
        status: "active",
        ...(search && {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { shortName: { $regex: search, $options: "i" } },
          ],
        }),
      })
        .select("name shortName")
        .lean();

      results.exams = examTypes
        .map((e) => ({
          name: e.name,
          shortName: e.shortName,
          value: e._id.toString(),
          id: e._id.toString(),
          count: allocMaps.exams.get(e._id.toString()) || 0,
        }))
        .filter((e) => e.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }

    // Get Courses
    if (type === "all" || type === "courses") {
      const courses = await Course.find({
        status: "active",
        ...(search && { name: { $regex: search, $options: "i" } }),
      })
        .populate("streamId", "name")
        .select("name streamId")
        .lean();

      results.courses = courses
        .map((c) => ({
          name: c.name,
          value: c._id.toString(),
          id: c._id.toString(),
          stream: c.streamId?.name,
          count: allocMaps.courses.get(c._id.toString()) || 0,
        }))
        .filter((c) => c.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);
    }

    // Get Fee Ranges
    if (type === "all" || type === "feeRanges") {
      const feeRanges = [
        { name: "Upto 3 Lakh", minFee: 0, maxFee: 300000, value: "0-300000" },
        { name: "Upto 5 Lakh", minFee: 0, maxFee: 500000, value: "0-500000" },
        {
          name: "Upto 10 Lakh",
          minFee: 0,
          maxFee: 1000000,
          value: "0-1000000",
        },
        {
          name: "Above 10 Lakh",
          minFee: 1000000,
          maxFee: Infinity,
          value: "1000000-Infinity",
        },
      ];

      const currentYear = new Date().getFullYear();
      const allAllocations = await CollegeCourseAllocation.find({})
        .select("college assignedCourses")
        .lean();

      results.feeRanges = feeRanges.map((range) => {
        const collegesInRange = new Set();
        allAllocations.forEach((allocation) => {
          allocation.assignedCourses?.forEach((assignedCourse) => {
            if (!assignedCourse.isActive) return;
            const currentYearStructure = assignedCourse.feeStructures?.find(
              (structure) => {
                if (!structure.session) return false;
                const sessionStartYear = parseInt(
                  structure.session.split("-")[0],
                  10,
                );
                return sessionStartYear === currentYear;
              },
            );
            if (currentYearStructure) {
              const totalFee = currentYearStructure.periods?.reduce(
                (sum, p) => sum + (p.amount || 0),
                0,
              );
              if (totalFee >= range.minFee && totalFee <= range.maxFee) {
                collegesInRange.add(allocation.college.toString());
              }
            }
          });
        });
        return {
          name: range.name,
          count: collegesInRange.size,
          value: range.value,
          id: range.value,
        };
      });
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
      {
        success: false,
        error: "Failed to fetch colleges filters",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
