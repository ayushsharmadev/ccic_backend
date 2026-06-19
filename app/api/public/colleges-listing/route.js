import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { College, Ownership } from "@/lib/models";
import CollegeCourseAllocation from "@/lib/models/CollegeCourseAllocation";
import {
  applyCityDistrictFilter,
  applyDirectLocationFilters,
} from "@/lib/locationFilters";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    // Search
    const searchQuery = searchParams.get("search") || "";

    // Filters
    const country = searchParams.get("country") || "";
    const state = searchParams.get("state") || "";
    const district = searchParams.get("district") || "";
    const city = searchParams.get("city") || "";
    const ownership = searchParams.get("ownership") || "";
    const exam = searchParams.get("exam") || "";
    const course = searchParams.get("course") || "";
    const feeRange = searchParams.get("feeRange") || "";

    // Sorting
    const sortBy = searchParams.get("sortBy") || "alphabetical"; // alphabetical, popularity, fees_low_to_high

    // Build filter object
    const filter = { status: "active" };

    // Add search filter
    if (searchQuery) {
      filter.$or = [
        { name: { $regex: searchQuery, $options: "i" } },
        { popularName: { $regex: searchQuery, $options: "i" } },
        { shortName: { $regex: searchQuery, $options: "i" } },
        { location: { $regex: searchQuery, $options: "i" } },
        { shortDescription: { $regex: searchQuery, $options: "i" } },
      ];
    }

    // Add location filters
    applyDirectLocationFilters(filter, { country, state, district });
    await applyCityDistrictFilter(filter, { city, country, state, district });

    // Add ownership filter
    if (ownership) {
      const ownershipTypes = await Ownership.find({
        name: { $regex: ownership, $options: "i" },
        status: "active",
      }).select("_id");

      if (ownershipTypes.length > 0) {
        filter.ownership = { $in: ownershipTypes.map((o) => o._id) };
      }
    }

    // Exam and Course filters will be applied after fetching course allocations
    let examTypeFilter = null;
    let courseFilter = null;

    if (exam) {
      // Exam parameter should be exam type ID
      examTypeFilter = [exam];
    }

    if (course) {
      // Course parameter should be course ID
      courseFilter = [course];
    }

    // Fee range filter will be applied after fetching course allocations
    // feeRange should be in format: "0-300000" or "1000000-Infinity"
    let feeRangeFilter = null;
    if (feeRange) {
      const [minFeeStr, maxFeeStr] = feeRange.split("-");
      const minFee = parseInt(minFeeStr, 10) || 0;
      const maxFee =
        maxFeeStr === "Infinity" ? Infinity : parseInt(maxFeeStr, 10) || Infinity;

      feeRangeFilter = { minFee, maxFee };
    }

    // Build sort object
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
      case "fees_low_to_high":
        // This would need actual fee data implementation
        sort = { displayOrder: 1, createdAt: -1 };
        break;
      default:
        sort = {
          displayOrder: 1,
          isFeatured: -1,
          isPopular: -1,
          createdAt: -1,
        };
    }

    // Get colleges with populated references
    const colleges = await College.find(filter)
      .populate("country", "name code")
      .populate("state", "name code")
      .populate("district", "name")
      .populate("ownership", "name")
      .populate("affiliation", "name")
      .populate("languages", "name")
      .select(
        "name popularName shortName estdYear campusSize logo banner brochure shortDescription longDescription country state district ownership affiliation isFeatured isPopular isVerified displayOrder slug addressLine1 addressLine2 location landmark pinCode phoneNumber websiteUrl emailAddress hostelFacilities hostelGallery intake languages"
      )
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await College.countDocuments(filter);

    // Fetch course allocations for all colleges
    const currentYear = new Date().getFullYear();
    const collegeIds = colleges.map((c) => c._id);
    const courseAllocations = await CollegeCourseAllocation.find({
      college: { $in: collegeIds },
    })
      .populate({
        path: "assignedCourses.course",
        select: "name slug",
      })
      .populate({
        path: "assignedCourses.examType",
        select: "name shortName",
      })
      .lean();

    // Create a map of college ID to courses with current year fees
    const collegeCourseMap = {};

    courseAllocations.forEach((allocation) => {
      const collegeId = allocation.college.toString();
      const coursesWithFees = [];

      allocation.assignedCourses?.forEach((assignedCourse) => {
        if (!assignedCourse.isActive) return;

        // Apply exam type filter if specified
        if (examTypeFilter) {
          const courseExamTypeId = assignedCourse.examType?._id?.toString() ||
            assignedCourse.examType?.toString() || "";

          if (!examTypeFilter.includes(courseExamTypeId)) {
            return; // Skip this course if exam type doesn't match
          }
        }

        // Apply course filter if specified
        if (courseFilter) {
          const courseId = assignedCourse.course?._id?.toString() ||
            assignedCourse.course?.toString() || "";
          if (!courseFilter.includes(courseId)) {
            return; // Skip this course if course doesn't match
          }
        }

        // Find fee structure where session starts with current year
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

        if (currentYearStructure && assignedCourse.course) {
          coursesWithFees.push({
            name: assignedCourse.course.name,
            slug: assignedCourse.course.slug,
            examType: assignedCourse.examType || null,
            session: currentYearStructure.session,
            feeStructureType: currentYearStructure.structureType,
            seats: currentYearStructure.seats,
            periods: currentYearStructure.periods || [],
          });
        }
      });

      collegeCourseMap[collegeId] = coursesWithFees;
    });

    // Transform the data for frontend consumption
    const transformedColleges = colleges.map((college) => {
      const collegeCoursesWithFees =
        collegeCourseMap[college._id.toString()] || [];
      // Build address
      const addressParts = [
        college.addressLine1,
        college.addressLine2,
        college.location,
        college.landmark,
        college.district?.name,
        college.state?.name,
        college.pinCode,
      ].filter(Boolean);

      const address = addressParts.join(", ");

      // Build courses string from CollegeCourseAllocation with exam types and seats
      const coursesString =
        collegeCoursesWithFees.length > 0
          ? collegeCoursesWithFees
            .map((c) => {
              const examType = c.examType?.shortName || c.examType?.name || "";
              const seats = c.seats !== undefined && c.seats !== null ? ` (${c.seats} seats)` : "";
              const examPart = examType ? ` (${examType})` : "";
              return `${c.name}${examPart}${seats}`;
            })
            .join(" | ")
          : null;

      // Seat intake removed - using dynamic courses instead

      // Build fees from CollegeCourseAllocation current year data
      let totalFeeAmount = 0;
      const fees = (() => {
        if (collegeCoursesWithFees.length > 0) {
          // Calculate total fee from first course's periods
          const firstCourse = collegeCoursesWithFees[0];
          if (firstCourse.periods && firstCourse.periods.length > 0) {
            totalFeeAmount = firstCourse.periods.reduce(
              (sum, period) => sum + (period.amount || 0),
              0
            );
            if (totalFeeAmount > 0) {
              return `₹${(totalFeeAmount / 100000).toFixed(1)}L`;
            }
          }
        }
        return "₹3.5L"; // Default fallback
      })();

      // Build cutoff (this would need actual cutoff data)
      const cutoff = "450+"; // Default fallback

      // Build rating (this would need actual rating data)
      const rating = "4.6"; // Default fallback

      // Build university name
      const university = college.affiliation?.name || "";

      const locationParts = [
        college.district?.name,
        college.state?.name,
        college.country?.name,
      ].filter(Boolean);

      return {
        id: college._id.toString(),
        slug: college.slug,
        name: college.name,
        popularName: college.popularName,
        shortName: college.shortName,
        address: address,
        established: college.estdYear,
        type: college.ownership?.name || "Private",
        courses: coursesString,
        logo: college.logo || "/no-college-image.png", // Default fallback
        banner: college.banner,
        brochure: college.brochure,
        fees: fees,
        cutoff: cutoff,
        hospital: true, // Default fallback
        courses_offered: true, // Default fallback
        facilities: true, // Default fallback
        rating: rating,
        university: university,
        location: locationParts.join(", ") || college.location || "",
        year: college.estdYear,
        // Additional fields for filtering
        country: college.country?.name,
        state: college.state?.name,
        district: college.district?.name,
        ownership: college.ownership?.name,
        affiliation: college.affiliation?.name,
        stream: college.stream?.name,
        degree: college.degreeType?.name,
        ranking: college.ranking?.name,
        rankValue: college.ranking?.rankValue,
        isFeatured: college.isFeatured,
        isPopular: college.isPopular,
        isVerified: college.isVerified,
        displayOrder: college.displayOrder,
        hostelFacilities: college.hostelFacilities || [],
        hostelGallery: college.hostelGallery || [],
        intake: college.intake || [],
        languages: college.languages || [],
      };
    });

    // Apply filters: exam, course, and fee range
    let filteredColleges = transformedColleges;

    // Filter by exam type or course (if no matching courses, exclude college)
    if (examTypeFilter || courseFilter) {
      filteredColleges = filteredColleges.filter((college) => {
        const collegeCoursesWithFees =
          collegeCourseMap[college.id.toString()] || [];
        return collegeCoursesWithFees.length > 0;
      });
    }

    // Filter by fee range
    if (feeRangeFilter) {
      filteredColleges = filteredColleges.filter((college) => {
        const collegeCoursesWithFees =
          collegeCourseMap[college.id.toString()] || [];
        if (collegeCoursesWithFees.length === 0) return false;

        const firstCourse = collegeCoursesWithFees[0];
        if (!firstCourse.periods || firstCourse.periods.length === 0)
          return false;

        const totalFee = firstCourse.periods.reduce(
          (sum, period) => sum + (period.amount || 0),
          0
        );

        return (
          totalFee >= feeRangeFilter.minFee && totalFee <= feeRangeFilter.maxFee
        );
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        colleges: filteredColleges,
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
          city,
          ownership,
          exam,
          course,
          feeRange,
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
      { status: 500 }
    );
  }
}
