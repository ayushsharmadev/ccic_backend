import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import BlogCategory from "@/lib/models/BlogCategory";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/blog-categories - Get all blog categories with pagination and search
export const GET = withAdminAuth(async (request) => {
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
      BlogCategory.find(filter)
        .sort({ displayOrder: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BlogCategory.countDocuments(filter),
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
    console.error("Error fetching blog categories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch blog categories" },
      { status: 500 }
    );
  }
});

// POST /api/blog-categories - Create new blog category
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

    // Auto-generate slug if not provided
    let slug = body.slug || body.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    // Check if slug already exists
    let originalSlug = slug;
    let counter = 1;
    while (await BlogCategory.findOne({ slug })) {
      slug = `${originalSlug}-${counter}`;
      counter++;
    }

    const category = new BlogCategory({
      name: body.name,
      slug,
      description: body.description || "",
      color: body.color || "#3b82f6",
      icon: body.icon || "",
      displayOrder: body.displayOrder || 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    const savedCategory = await category.save();

    return NextResponse.json({
      success: true,
      data: savedCategory,
      message: "Blog category created successfully",
    });
  } catch (error) {
    console.error("Error creating blog category:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Category with this name or slug already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create blog category" },
      { status: 500 }
    );
  }
});

