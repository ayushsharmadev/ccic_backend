import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import NewsCategory from "@/lib/models/NewsCategory";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/news-categories/[id] - Get single news category
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Find category
    const category = await NewsCategory.findById(id);

    if (!category) {
      return NextResponse.json(
        { success: false, error: "News category not found" },
        { status: 404 }
      );
    }

    // Transform the data
    const transformedCategory = {
      id: category._id,
      name: category.name,
      description: category.description,
      color: category.color,
      displayOrder: category.displayOrder,
      isActive: category.isActive,
      slug: category.slug,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedCategory,
    });
  } catch (error) {
    console.error("Error fetching news category:", error);

    // Handle cast error (invalid ObjectId)
    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid category ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch news category" },
      { status: 500 }
    );
  }
});

// PUT /api/news-categories/[id] - Update news category
export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Category ID is required" },
        { status: 400 }
      );
    }

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

    // Check if slug already exists (excluding current category)
    const existingCategory = await NewsCategory.findOne({
      slug,
      _id: { $ne: id },
    });
    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: "A category with this name already exists" },
        { status: 400 }
      );
    }

    // Update category
    const updatedCategory = await NewsCategory.findByIdAndUpdate(
      id,
      {
        name: body.name,
        description: body.description || "",
        color: body.color || "#6B7280",
        displayOrder: body.displayOrder || 0,
        isActive: body.isActive !== undefined ? body.isActive : true,
        slug,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return NextResponse.json(
        { success: false, error: "News category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "News category updated successfully",
      data: {
        id: updatedCategory._id,
        name: updatedCategory.name,
        slug: updatedCategory.slug,
      },
    });
  } catch (error) {
    console.error("Error updating news category:", error);

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

    // Handle cast error (invalid ObjectId)
    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid category ID format" },
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
      { success: false, error: "Failed to update news category" },
      { status: 500 }
    );
  }
});

// DELETE /api/news-categories/[id] - Delete news category
export const DELETE = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Check if category is being used by any news articles
    const News = (await import("@/lib/models/News")).default;
    const newsUsingCategory = await News.findOne({ category: id });

    if (newsUsingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete category. It is being used by news articles.",
        },
        { status: 400 }
      );
    }

    // Delete category
    const deletedCategory = await NewsCategory.findByIdAndDelete(id);

    if (!deletedCategory) {
      return NextResponse.json(
        { success: false, error: "News category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "News category deleted successfully",
      data: {
        id: deletedCategory._id,
        name: deletedCategory.name,
      },
    });
  } catch (error) {
    console.error("Error deleting news category:", error);

    // Handle cast error (invalid ObjectId)
    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid category ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete news category" },
      { status: 500 }
    );
  }
});
