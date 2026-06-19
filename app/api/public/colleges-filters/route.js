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
    const type = searchParams.get("type") || "all"; // all, countries, states, cities, ownership, exams, feeRanges

    const results = {};

    // Get Countries with college counts
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

      const countriesWithCounts = await Promise.all(
        countries.map(async (countryItem) => {
          const count = await College.countDocuments({
            country: countryItem._id,
            status: "active",
          });
          return {
            name: countryItem.name,
            code: countryItem.code,
            count,
            value: countryItem._id.toString(),
            id: countryItem._id.toString(),
          };
        })
      );

      results.countries = countriesWithCounts
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count);
    }

    // Get States with college counts
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

      if (country) {
        stateFilter.country = country;
      }

      const states = await State.find(stateFilter)
        .populate("country", "name code")
        .select("name code country")
        .lean();

      const statesWithCounts = await Promise.all(
        states.map(async (stateItem) => {
          const count = await College.countDocuments({
            state: stateItem._id,
            status: "active",
          });
          return {
            name: stateItem.name,
            code: stateItem.code,
            count,
            value: stateItem._id.toString(),
            id: stateItem._id.toString(),
            country: stateItem.country?.name,
          };
        })
      );

      results.states = statesWithCounts
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count);
    }

    // Get Cities (Districts) with college counts
    if (type === "all" || type === "cities") {
      const districtFilter = {
        status: "active",
        ...(search && { name: { $regex: search, $options: "i" } }),
      };

      if (state) {
        districtFilter.state = state;
      } else if (country) {
        const countryStates = await State.find({
          country,
          status: "active",
        })
          .select("_id")
          .lean();
        districtFilter.state = {
          $in: countryStates.map((item) => item._id),
        };
      }

      const districts = await District.find(districtFilter)
        .populate({
          path: "state",
          select: "name country",
          populate: { path: "country", select: "name" },
        })
        .select("name state")
        .lean();

      const citiesWithCounts = await Promise.all(
        districts.map(async (district) => {
          const count = await College.countDocuments({
            district: district._id,
            status: "active",
          });
          return {
            name: district.name,
            count,
            id: `city-${district._id}`,
            state: district.state?.name,
            country: district.state?.country?.name,
          };
        })
      );

      results.cities = citiesWithCounts
        .filter((city) => city.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // Limit to top 20 cities
    }

    // Get Ownership Types with college counts
    if (type === "all" || type === "ownership") {
      const ownershipTypes = await Ownership.find({
        status: "active",
        ...(search && { name: { $regex: search, $options: "i" } }),
      })
        .select("name")
        .lean();

      const ownershipWithCounts = await Promise.all(
        ownershipTypes.map(async (ownership) => {
          const count = await College.countDocuments({
            ownership: ownership._id,
            status: "active",
          });
          return {
            name: ownership.name,
            count,
            id: `ownership-${ownership._id}`,
          };
        })
      );

      results.ownership = ownershipWithCounts
        .filter((ownership) => ownership.count > 0)
        .sort((a, b) => b.count - a.count);
    }

    // Get Exam Types with college counts
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

      const examWithCounts = await Promise.all(
        examTypes.map(async (examType) => {
          // Count colleges that have courses with this exam type
          const allocations = await CollegeCourseAllocation.find({
            "assignedCourses.examType": examType._id,
            "assignedCourses.isActive": true,
          })
            .select("college")
            .lean();

          const uniqueColleges = [
            ...new Set(allocations.map((a) => a.college.toString())),
          ];

          return {
            name: examType.name,
            shortName: examType.shortName,
            count: uniqueColleges.length,
            value: examType._id.toString(),
            id: examType._id.toString(),
          };
        })
      );

      results.exams = examWithCounts
        .filter((exam) => exam.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Limit to top 10 exam types
    }

    // Get Courses with college counts
    if (type === "all" || type === "courses") {
      const courses = await Course.find({
        status: "active",
        ...(search && { name: { $regex: search, $options: "i" } }),
      })
        .populate("streamId", "name")
        .select("name streamId")
        .lean();

      const coursesWithCounts = await Promise.all(
        courses.map(async (course) => {
          // Count colleges that have this course allocated
          const allocations = await CollegeCourseAllocation.find({
            "assignedCourses.course": course._id,
            "assignedCourses.isActive": true,
          })
            .select("college")
            .lean();

          const uniqueColleges = [
            ...new Set(allocations.map((a) => a.college.toString())),
          ];

          return {
            name: course.name,
            count: uniqueColleges.length,
            value: course._id.toString(),
            id: course._id.toString(),
            stream: course.streamId?.name,
          };
        })
      );

      results.courses = coursesWithCounts
        .filter((course) => course.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 15); // Limit to top 15 courses
    }

    // Get Fee Ranges with actual counts based on CollegeCourseAllocation
    if (type === "all" || type === "feeRanges") {
      const feeRanges = [
        { name: "Upto 3 Lakh", minFee: 0, maxFee: 300000, value: "0-300000" },
        { name: "Upto 5 Lakh", minFee: 0, maxFee: 500000, value: "0-500000" },
        { name: "Upto 10 Lakh", minFee: 0, maxFee: 1000000, value: "0-1000000" },
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

      const feeRangesWithCounts = feeRanges.map((range) => {
        const collegesInRange = new Set();

        allAllocations.forEach((allocation) => {
          allocation.assignedCourses?.forEach((assignedCourse) => {
            if (!assignedCourse.isActive) return;

            // Find current year session
            const currentYearStructure = assignedCourse.feeStructures?.find(
              (structure) => {
                if (!structure.session) return false;
                const sessionStartYear = parseInt(
                  structure.session.split("-")[0],
                  10
                );
                return sessionStartYear === currentYear;
              }
            );

            if (currentYearStructure) {
              const totalFee = currentYearStructure.periods?.reduce(
                (sum, p) => sum + (p.amount || 0),
                0
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
          id: range.value, // Use value as ID for consistency
        };
      });

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
    console.error("Error fetching colleges filters:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch colleges filters",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
