import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import College from "@/lib/models/College";
import {
  applyDirectLocationFilters,
} from "@/lib/locationFilters";

// Disable caching for fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/public/colleges - Get colleges for public pages (no auth required)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured"); // Get featured colleges
    const popular = searchParams.get("popular"); // Get popular colleges
    const top = searchParams.get("top"); // Get top colleges (ranked)
    const limit = parseInt(searchParams.get("limit")) || 6; // Default 6 colleges
    const count = searchParams.get("count"); // Get total count only
    const country = searchParams.get("country") || "";
    const state = searchParams.get("state") || "";
    const district = searchParams.get("district") || "";

    // If only count is requested
    if (count === "true") {
      const countFilter = { status: "active" };
      applyDirectLocationFilters(countFilter, { country, state, district });
      const totalCount = await College.countDocuments(countFilter);
      return NextResponse.json({
        success: true,
        data: {
          totalCount,
        },
      });
    }

    // Build filter for active colleges
    const filter = { status: "active" };
    applyDirectLocationFilters(filter, { country, state, district });

    // Add featured filter if requested
    if (featured === "true") {
      filter.isFeatured = true;
    }

    // Add popular filter if requested
    if (popular === "true") {
      filter.isPopular = true;
    }

    // Add top colleges filter if requested (colleges with ranking)
    if (top === "true") {
      filter.ranking = { $exists: true, $ne: null };
    }

    // Determine sorting based on request type
    let sortCriteria;
    if (top === "true") {
      // For top colleges, prioritize ranking, then displayOrder
      sortCriteria = {
        "ranking.rankValue": 1,
        displayOrder: 1,
        isFeatured: -1,
        isPopular: -1,
        createdAt: -1,
      };
    } else {
      // Default sorting for featured/popular/all colleges
      sortCriteria = {
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
      .select(
        "name popularName shortName estdYear campusSize logo banner shortDescription longDescription collegeGallery hostelGallery campusGallery hostelFacilities country state district ownership affiliation isFeatured isPopular displayOrder slug phoneNumber"
      )
      .sort(sortCriteria)
      .limit(limit)
      .lean();

    // Transform the data for public consumption
    const transformedColleges = colleges.map((college) => ({
      id: college._id,
      slug: college.slug,
      name: college.name,
      popularName: college.popularName,
      shortName: college.shortName,
      estdYear: college.estdYear,
      campusSize: college.campusSize,
      logo: college.logo || "/no-college-image.png",
      banner: college.banner || "/no-college-image.png",
      shortDescription: college.shortDescription,
      longDescription: college.longDescription,
      phoneNumber: college.phoneNumber || "",
      location: college.district
        ? `${college.district.name}, ${college.state?.name}`
        : college.state?.name || "",
      country: college.country?.name || "",
      state: college.state?.name || "",
      district: college.district?.name || "",
      ownership: college.ownership?.name || "",
      affiliation: college.affiliation?.name || "",
      galleries: {
        college: college.collegeGallery || [],
        hostel: college.hostelGallery || [],
        campus: college.campusGallery || [],
      },
      hostelFacilities: college.hostelFacilities || [],
      isFeatured: college.isFeatured,
      isPopular: college.isPopular,
    }));

    // Get total count based on filter type
    let totalCount = null;
    const countFilter = { status: "active" };
    applyDirectLocationFilters(countFilter, { country, state, district });

    if (featured === "true") {
      totalCount = await College.countDocuments({
        ...countFilter,
        isFeatured: true,
      });
    } else if (popular === "true") {
      totalCount = await College.countDocuments({
        ...countFilter,
        isPopular: true,
      });
    } else if (top === "true") {
      totalCount = await College.countDocuments({
        ...countFilter,
        ranking: { $exists: true, $ne: null },
      });
    } else {
      totalCount = await College.countDocuments(countFilter);
    }

    const response = NextResponse.json({
      success: true,
      data: {
        colleges: transformedColleges,
        totalCount,
        filters: {
          featured: featured === "true",
          popular: popular === "true",
          top: top === "true",
          country: country || null,
          state: state || null,
          district: district || null,
          limit,
        },
      },
    });

    // Set cache-control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error("Error fetching public colleges:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch colleges",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
