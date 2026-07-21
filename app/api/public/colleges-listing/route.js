import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { College, Ownership, Country, Exam } from "@/lib/models";
import CollegeCourseAllocation from "@/lib/models/CollegeCourseAllocation";
import { applyDirectLocationFilters } from "@/lib/locationFilters";

function compactPath(path) {
  return path || null;
}
function buildLocation(college) {
  const parts = [
    college.location,
    college.district?.name,
    college.state?.name,
    college.country?.name,
  ]
    .filter(Boolean)
    .flatMap((part) => String(part).split(","))
    .map((part) => part.trim())
    .filter(Boolean);

  return parts
    .filter(
      (part, index) =>
        parts.findIndex((item) => item.toLowerCase() === part.toLowerCase()) ===
        index,
    )
    .join(", ");
}

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page"), 10) || 1;
    const limit = parseInt(searchParams.get("limit"), 10) || 10;
    const skip = (page - 1) * limit;

    const searchQuery = searchParams.get("search") || "";
    const country = searchParams.get("country") || "";
    const countrySlug = searchParams.get("countrySlug") || "";
    const state = searchParams.get("state") || "";
    const district = searchParams.get("district") || "";
    const ownership = searchParams.get("ownership") || "";
    const sortBy = searchParams.get("sortBy") || "alphabetical";
    const course = searchParams.get("course") || "";
    const exam = searchParams.get("exam") || "";

    const filter = { status: "active" };

    if (searchQuery) {
      filter.$or = [
        { name: { $regex: searchQuery, $options: "i" } },
        { popularName: { $regex: searchQuery, $options: "i" } },
        { shortName: { $regex: searchQuery, $options: "i" } },
        { location: { $regex: searchQuery, $options: "i" } },
        { shortDescription: { $regex: searchQuery, $options: "i" } },
      ];
    }

    applyDirectLocationFilters(filter, { country, state, district });

    if (countrySlug) {
      const countryBySlug = await Country.findOne({
        slug: countrySlug,
        status: "active",
      })
        .select("_id")
        .lean();

      filter.country = countryBySlug?._id?.toString() || { $in: [] };
    }

    if (ownership) {
      const ownershipTypes = await Ownership.find({
        name: { $regex: ownership, $options: "i" },
        status: "active",
      })
        .select("_id")
        .lean();

      if (ownershipTypes.length > 0) {
        filter.ownership = { $in: ownershipTypes.map((o) => o._id) };
      }
    }

    if (course || exam) {
      const allocationMatch = { "assignedCourses.isActive": true };
      if (course) {
        try {
          allocationMatch["assignedCourses.course"] = new mongoose.Types.ObjectId(course);
        } catch(e) { }
      }
      if (exam) {
        try {
          const actualExam = await Exam.findById(exam).select("courseName").lean();
          if (actualExam && actualExam.courseName) {
             allocationMatch["assignedCourses.course"] = actualExam.courseName;
          } else {
             allocationMatch["assignedCourses.course"] = null;
          }
        } catch(e) { }
      }

      const allocations = await CollegeCourseAllocation.aggregate([
        { $match: allocationMatch },
        { $unwind: "$assignedCourses" },
        { $match: allocationMatch },
        { $group: { _id: "$college" } }
      ]);

      const matchedCollegeIds = allocations.map(a => a._id);
      
      if (filter._id) {
        // In case _id is already being filtered (rare but safe)
        filter._id = { $in: matchedCollegeIds.filter(id => filter._id.$in?.includes(id)) };
      } else {
        filter._id = { $in: matchedCollegeIds };
      }
    }

    let sort = {};
    switch (sortBy) {
      case "alphabetical":
        sort = { name: 1 };
        break;
      case "popularity":
        sort = {
          isPopular: -1,
          isFeatured: -1,
          displayOrder: 1,
          createdAt: -1,
        };
        break;
      default:
        sort = {
          displayOrder: 1,
          isFeatured: -1,
          isPopular: -1,
          createdAt: -1,
        };
    }

    const collegeQuery = College.find(filter)
      .populate("country", "name")
      .populate("state", "name")
      .populate("district", "name")
      .populate("ownership", "name")
      .populate("affiliation", "name")
      .select(
        "name popularName shortName estdYear logo banner brochure location country state district ownership affiliation isFeatured isPopular isVerified displayOrder slug",
      )
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const [colleges, totalCount] = await Promise.all([
      collegeQuery,
      College.countDocuments(filter),
    ]);

    const transformedColleges = colleges.map((college) => {
      const location = buildLocation(college);

      return {
        id: college._id.toString(),
        slug: college.slug,
        name: college.name,
        popularName: college.popularName,
        shortName: college.shortName,
        logo: compactPath(college.logo || "/no-college-image.png"),
        banner: compactPath(college.banner),
        brochure: compactPath(college.brochure),
        hasBrochure: Boolean(college.brochure),
        location: location || college.location || "",
        established: college.estdYear,
        ownership: college.ownership?.name,
        affiliation: college.affiliation?.name,
        isFeatured: college.isFeatured,
        isPopular: college.isPopular,
        isVerified: college.isVerified,
        displayOrder: college.displayOrder,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        colleges: transformedColleges,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1,
        },
        filters: {
          search: searchQuery,
          country,
          state,
          district,
          ownership,
          sortBy,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching colleges listing:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch colleges listing",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

