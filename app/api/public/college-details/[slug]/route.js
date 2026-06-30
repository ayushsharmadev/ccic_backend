import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import College from "@/lib/models/College";
import FacilitySection from "@/lib/models/FacilitySection";
import CollegeCourseAllocation from "@/lib/models/CollegeCourseAllocation";
import CollegeRanking from "@/lib/models/CollegeRanking";
import CollegeDistanceMeter from "@/lib/models/CollegeDistanceMeter";
import CollegeReview from "@/lib/models/CollegeReview";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

function getSessionStartYear(session) {
  const year = parseInt(String(session || "").split("-")[0], 10);
  return Number.isFinite(year) ? year : 0;
}

function pickFeeStructure(feeStructures = [], currentYear) {
  const structures = feeStructures
    .filter((structure) => structure?.session)
    .sort(
      (a, b) => getSessionStartYear(b.session) - getSessionStartYear(a.session),
    );

  return (
    structures.find(
      (structure) => getSessionStartYear(structure.session) === currentYear,
    ) ||
    structures[0] ||
    null
  );
}

export async function GET(request, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { slug } = resolvedParams;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "College slug is required" },
        { status: 400 },
      );
    }

    // Find college by slug or ID - handle ObjectId properly
    let query = { slug: slug };

    // If slug looks like an ObjectId, also search by _id
    if (mongoose.Types.ObjectId.isValid(slug)) {
      query = {
        $or: [{ slug: slug }, { _id: new mongoose.Types.ObjectId(slug) }],
      };
    }

    const college = await College.findOne(query)
      .populate("country", "name code")
      .populate("state", "name code")
      .populate("district", "name")
      .populate("ownership", "name")
      .populate("affiliation", "name")
      .populate("approvedThrough", "name")
      .populate("languages", "name")
      .populate("facilities", "name image description")
      .populate("hospitalFacilities", "name image description")
      .populate("hostelFacilities", "name image description")
      .lean({ virtuals: true });

    if (!college) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 },
      );
    }

    // Fetch facility sections for this college
    const facilitySections = await FacilitySection.find({
      college: college._id,
      status: "active",
    })
      .select("title tabName slug content displayOrder")
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    // Fetch course allocations with current year session filtering
    const currentYear = new Date().getFullYear();
    const courseAllocation = await CollegeCourseAllocation.findOne({
      college: college._id,
    })
      .populate({
        path: "assignedCourses.course",
        select: "name slug logo icon streamId degreeId description status",
        populate: [
          { path: "streamId", select: "name" },
          { path: "degreeId", select: "name shortName" },
        ],
      })
      .populate({
        path: "assignedCourses.courseDuration",
        select: "value unit name",
      })
      .populate({
        path: "assignedCourses.examType",
        select: "name shortName",
      })
      .lean();

    // Prefer current year fees, but fall back to the latest uploaded session.
    const coursesWithFees = [];
    if (courseAllocation && courseAllocation.assignedCourses) {
      for (const assignedCourse of courseAllocation.assignedCourses) {
        if (!assignedCourse.isActive) continue;

        const feeStructure = pickFeeStructure(
          assignedCourse.feeStructures,
          currentYear,
        );

        if (feeStructure && assignedCourse.course) {
          coursesWithFees.push({
            course: assignedCourse.course,
            courseDuration: assignedCourse.courseDuration,
            examType: assignedCourse.examType || null,
            session: feeStructure.session,
            feeStructureType: feeStructure.structureType,
            seats: feeStructure.seats,
            periods: feeStructure.periods || [],
            notes: assignedCourse.notes,
          });
        }
      }
    }

    // Fetch rankings (for future use - not displayed yet)
    const rankingDoc = await CollegeRanking.findOne({
      college: college._id,
    })
      .populate({
        path: "rankings.ranking",
        select: "name rankValue description",
      })
      .lean();

    // Fetch distance meters
    const distanceMeterDoc = await CollegeDistanceMeter.findOne({
      college: college._id,
    })
      .populate({
        path: "distanceMeters.distanceMeter",
        select: "name shortDescription icon status",
      })
      .lean();

    // Fetch approved reviews (limit to 10 for overview, full list available on reviews page)
    const reviews = await CollegeReview.find({
      college: college._id,
      status: "approved",
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Filter only approved replies
    const reviewsWithApprovedReplies = reviews.map((review) => ({
      ...review,
      replies: (review.replies || []).filter(
        (reply) => reply.status === "approved",
      ),
    }));

    // Transform college data for frontend
    const transformedCollege = {
      id: college._id,
      slug: college.slug,
      name: college.name,
      popularName: college.popularName,
      shortName: college.shortName,
      estdYear: college.estdYear,
      campusSize: college.campusSize,
      courseType: college.courseType,

      // Location information
      location: college.location,
      mapEmbedUrl: college.mapEmbedUrl,
      address: {
        line1: college.addressLine1,
        line2: college.addressLine2,
        landmark: college.landmark,
        pinCode: college.pinCode,
        fullAddress: college.fullAddress,
      },

      // Relationships
      country: college.country,
      state: college.state,
      district: college.district,
      ownership: college.ownership,
      affiliation: college.affiliation,
      approvedThrough: college.approvedThrough,

      // Contact information
      contact: {
        phoneNumber: college.phoneNumber,
        tollFreeNumber: college.tollFreeNumber,
        helplineNumber: college.helplineNumber,
        websiteUrl: college.websiteUrl,
        emailAddress: college.emailAddress,
      },

      // Social media
      socialMedia: {
        facebookUrl: college.facebookUrl,
        twitterUrl: college.twitterUrl,
        instagramUrl: college.instagramUrl,
        youtubeUrl: college.youtubeUrl,
        linkedinUrl: college.linkedinUrl,
      },

      // Media
      media: {
        logo: college.logo || "/no-college-image.png",
        banner: college.banner || "/no-college-image.png",
        brochure: college.brochure,
        collegeGallery: college.collegeGallery || [],
        hostelGallery: college.hostelGallery || [],
        campusGallery: college.campusGallery || [],
      },

      // Content
      shortDescription: college.shortDescription,
      longDescription: college.longDescription,

      // Status and metadata
      status: college.status,
      isFeatured: college.isFeatured,
      isPopular: college.isPopular,
      isVerified: college.isVerified,
      displayOrder: college.displayOrder,

      // Facilities
      facilities: college.facilities || [],
      hospitalFacilities: college.hospitalFacilities || [],
      hostelFacilities: college.hostelFacilities || [],
      haveHostel: college.haveHostel,
      haveHospital: college.haveHospital,
      hospitalBeds: college.hospitalBeds,

      // Intake and Languages
      intake: college.intake || [],
      languages: college.languages || [],

      // Facility Sections (dynamic sections from admin)
      facilitySections: facilitySections || [],

      // Courses with current year fees (from CollegeCourseAllocation)
      coursesWithFees: coursesWithFees || [],

      // Rankings (for future use)
      rankings: rankingDoc?.rankings || [],

      // Distance Meters
      distanceMeters: distanceMeterDoc?.distanceMeters || [],

      // Reviews
      reviews: reviewsWithApprovedReplies || [],
      reviewsCount: college.reviewsCount || 0,
      averageRating: college.averageRating || 0,

      // Timestamps
      createdAt: college.createdAt,
      updatedAt: college.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedCollege,
    });
  } catch (error) {
    console.error("Error fetching college details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch college details" },
      { status: 500 },
    );
  }
}
