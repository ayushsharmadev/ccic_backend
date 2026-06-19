import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Course, Stream, Degree } from "@/lib/models";

// GET /api/public/courses - Get public courses data (no auth required)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const count = searchParams.get("count");
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit")) || 6;

    // If only count is requested
    if (count === "true") {
      const totalCount = await Course.countDocuments({
        status: "active",
      });

      return NextResponse.json({
        success: true,
        data: {
          totalCount,
        },
      });
    }

    // Check if this is a listing request (with filters)
    const listing = searchParams.get("listing");
    if (listing === "true") {
      // Pagination
      const page = parseInt(searchParams.get("page")) || 1;
      const limitParam = parseInt(searchParams.get("limit")) || 10;
      const skip = (page - 1) * limitParam;

      // Search
      const searchQuery = searchParams.get("search") || "";

      // Filters
      const stream = searchParams.get("stream") || "";
      const degree = searchParams.get("degree") || "";
      const feeRange = searchParams.get("feeRange") || "";
      const featuredFilter = searchParams.get("featured") || "";

      // Sorting
      const sortBy = searchParams.get("sortBy") || "alphabetical";

      // Build filter object
      const filter = { status: "active" };

      // Add search filter
      if (searchQuery) {
        filter.$or = [
          { name: { $regex: searchQuery, $options: "i" } },
          { description: { $regex: searchQuery, $options: "i" } },
        ];
      }

      // Add stream filter
      if (stream) {
        const streams = await Stream.find({
          name: { $regex: stream, $options: "i" },
          status: "Active",
        }).select("_id");

        if (streams.length > 0) {
          filter.streamId = { $in: streams.map((s) => s._id) };
        }
      }

      // Add degree filter
      if (degree) {
        const degrees = await Degree.find({
          name: { $regex: degree, $options: "i" },
          status: "active",
        }).select("_id");

        if (degrees.length > 0) {
          filter.degreeId = { $in: degrees.map((d) => d._id) };
        }
      }

      // Add featured filter
      if (featuredFilter === "true") {
        filter.isFeatured = true;
      }

      // Build sort object
      let sort = {};
      switch (sortBy) {
        case "alphabetical":
          sort = { name: 1 };
          break;
        case "popularity":
          sort = {
            isFeatured: -1,
            displayOrder: 1,
            createdAt: -1,
          };
          break;
        case "fees_low_to_high":
          sort = { averageFee: 1, displayOrder: 1, name: 1 };
          break;
        default:
          sort = {
            displayOrder: 1,
            isFeatured: -1,
            name: 1,
          };
      }

      // Get courses with populated references
      const courses = await Course.find(filter)
        .populate("streamId", "name")
        .populate("degreeId", "name")
        .select(
          "name logo icon averageFee description status isFeatured displayOrder slug"
        )
        .sort(sort)
        .skip(skip)
        .limit(limitParam)
        .lean();

      // Get total count for pagination
      const totalCount = await Course.countDocuments(filter);

      // Transform the data
      const transformedCourses = courses.map((course) => ({
        id: course._id,
        slug: course.slug,
        name: course.name,
        logo: course.logo,
        icon: course.icon,
        averageFee: course.averageFee,
        description: course.description,
        stream: course.streamId?.name || "",
        degree: course.degreeId?.name || "",
        isFeatured: course.isFeatured,
        displayOrder: course.displayOrder,
      }));

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limitParam);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return NextResponse.json({
        success: true,
        data: {
          courses: transformedCourses,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            hasNextPage,
            hasPrevPage,
            limit: limitParam,
          },
          filters: {
            search: searchQuery,
            stream,
            degree,
            feeRange,
            sortBy,
          },
        },
      });
    }

    // If featured courses is requested
    if (featured === "true") {
      const courses = await Course.find({
        status: "active",
        isFeatured: true,
      })
        .populate("streamId", "name")
        .populate("degreeId", "name")
        .select(
          "name logo icon averageFee description status isFeatured displayOrder"
        )
        .sort({ displayOrder: 1, name: 1 })
        .limit(limit)
        .lean({ virtuals: true });

      // Transform the data
      const transformedCourses = courses.map((item) => ({
        id: item._id,
        name: item.name,
        logo: item.logo,
        icon: item.icon,
        averageFee: item.averageFee,
        description: item.description,
        stream: {
          id: item.streamId?._id,
          name: item.streamId?.name,
        },
        degree: {
          id: item.degreeId?._id,
          name: item.degreeId?.name,
        },
        status: item.status,
        isFeatured: item.isFeatured,
        displayOrder: item.displayOrder,
      }));

      return NextResponse.json({
        success: true,
        data: {
          courses: transformedCourses,
        },
      });
    }

    // Default: Get all active courses with pagination
    const page = parseInt(searchParams.get("page")) || 1;
    const limitAll = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limitAll;

    const [courses, totalCount] = await Promise.all([
      Course.find({
        status: "active",
      })
        .populate("streamId", "name")
        .populate("degreeId", "name")
        .select(
          "name logo icon averageFee description status isFeatured displayOrder"
        )
        .sort({ displayOrder: 1, name: 1 })
        .skip(skip)
        .limit(limitAll)
        .lean({ virtuals: true }),
      Course.countDocuments({
        status: "active",
      }),
    ]);

    // Transform the data
    const transformedCourses = courses.map((item) => ({
      id: item._id,
      name: item.name,
      logo: item.logo,
      icon: item.icon,
      averageFee: item.averageFee,
      description: item.description,
      stream: {
        id: item.streamId?._id,
        name: item.streamId?.name,
      },
      degree: {
        id: item.degreeId?._id,
        name: item.degreeId?.name,
      },
      status: item.status,
      isFeatured: item.isFeatured,
      displayOrder: item.displayOrder,
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitAll);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        courses: transformedCourses,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: limitAll,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching public courses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch courses data" },
      { status: 500 }
    );
  }
}
