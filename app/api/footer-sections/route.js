import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FooterSection from "@/lib/models/FooterSection";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/footer-sections - Get all footer sections with pagination and filters
export const GET = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 50;
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive") || "";
    const sortBy = searchParams.get("sortBy") || "displayOrder";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { "links.title": { $regex: search, $options: "i" } },
      ];
    }

    if (isActive !== "") {
      filter.isActive = isActive === "true";
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get footer sections with pagination
    const [sections, totalCount] = await Promise.all([
      FooterSection.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      FooterSection.countDocuments(filter),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        sections,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit,
        },
        filters: {
          search,
          isActive,
          sortBy,
          sortOrder,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching footer sections:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch footer sections" },
      { status: 500 }
    );
  }
});

// POST /api/footer-sections - Create new footer section
export const POST = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        {
          success: false,
          error: "Title is required",
        },
        { status: 400 }
      );
    }

    // Validate links if provided
    if (body.links && Array.isArray(body.links)) {
      for (const link of body.links) {
        if (!link.title || !link.url) {
          return NextResponse.json(
            {
              success: false,
              error: "Each link must have a title and URL",
            },
            { status: 400 }
          );
        }
      }
    }

    // Create new footer section
    const section = new FooterSection({
      title: body.title,
      displayOrder: body.displayOrder || 0,
      links: body.links || [],
      isActive: body.isActive !== undefined ? body.isActive : true,
      sectionType: body.sectionType || "links",
      showArrowIcon: body.showArrowIcon || false,
    });

    const savedSection = await section.save();

    return NextResponse.json({
      success: true,
      message: "Footer section created successfully",
      data: savedSection,
    });
  } catch (error) {
    console.error("Error creating footer section:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create footer section" },
      { status: 500 }
    );
  }
});

