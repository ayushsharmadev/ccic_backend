import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import NewsCategory from "@/lib/models/NewsCategory";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/news-categories - Get all news categories (Public + Admin)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 8;
    const search = searchParams.get("search") || "";
    const activeOnly = searchParams.get("activeOnly") === "true";

    const filter = activeOnly ? { isActive: true } : {};

    // Add search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [categories, totalCount] = await Promise.all([
      NewsCategory.find(filter)
        .sort({ displayOrder: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NewsCategory.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: categories,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching news categories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch news categories" },
      { status: 500 }
    );
  }
}

// POST /api/news-categories - Create new news category
export const POST = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");

    // Check if slug already exists
    const existingCategory = await NewsCategory.findOne({ slug });
    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: "A category with this name already exists" },
        { status: 400 }
      );
    }

    // Create new category
    const category = new NewsCategory({
      name: body.name,
      description: body.description || "",
      color: body.color || "#6B7280",
      displayOrder: body.displayOrder || 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
      slug,
    });

    const savedCategory = await category.save();

    return NextResponse.json({
      success: true,
      message: "News category created successfully",
      data: {
        id: savedCategory._id,
        name: savedCategory.name,
        slug: savedCategory.slug,
      },
    });
  } catch (error) {
    console.error("Error creating news category:", error);

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

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "A category with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create news category" },
      { status: 500 }
    );
  }
});
