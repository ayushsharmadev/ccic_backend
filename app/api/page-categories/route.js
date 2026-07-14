import { withAdminAuth } from "@/lib/middleware/auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PageCategory from "@/lib/models/PageCategory";
import { verifyToken } from "@/lib/jwt";

// GET - List all page categories
export const GET = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 50;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [categories, totalCount] = await Promise.all([
      PageCategory.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PageCategory.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: categories,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching page categories:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch page categories",
      },
      { status: 500 }
    );
  }
});

// POST - Create new page category (Admin only)
export async function POST(request) {
  try {
    // Verify admin token
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { name, status } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 }
      );
    }

    // Check if category with same name exists
    const existingCategory = await PageCategory.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: "Category with this name already exists" },
        { status: 400 }
      );
    }

    const category = await PageCategory.create({
      name: name.trim(),
      status: status || "active",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Page category created successfully",
        data: category,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating page category:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create page category",
      },
      { status: 500 }
    );
  }
}

