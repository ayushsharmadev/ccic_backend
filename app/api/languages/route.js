import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Language from "@/lib/models/Language";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/languages - Get all languages with pagination and filters
export const GET = async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get languages with pagination
    const [languages, totalCount] = await Promise.all([
      Language.find(filter)
        .select("name shortDescription status createdAt updatedAt")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Language.countDocuments(filter),
    ]);

    // Transform the data
    const transformedLanguages = languages.map((language) => ({
      id: language._id,
      name: language.name,
      shortDescription: language.shortDescription || "",
      status: language.status,
      createdAt: language.createdAt,
      updatedAt: language.updatedAt,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: transformedLanguages,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching languages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch languages" },
      { status: 500 }
    );
  }
};

// POST /api/languages - Create new language
export const POST = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Language name is required",
        },
        { status: 400 }
      );
    }

    // Create new language
    const language = new Language({
      name: body.name,
      shortDescription: body.shortDescription || "",
      status: body.status || "active",
    });

    const savedLanguage = await language.save();

    return NextResponse.json({
      success: true,
      data: savedLanguage,
      message: "Language created successfully",
    });
  } catch (error) {
    console.error("Error creating language:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Language with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create language" },
      { status: 500 }
    );
  }
});

