import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import BlogCategory from "@/lib/models/BlogCategory";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/blog-categories/[id] - Get single blog category
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    const category = await BlogCategory.findById(id).lean();

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Blog category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error fetching blog category:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch blog category" },
      { status: 500 }
    );
  }
});

// PUT /api/blog-categories/[id] - Update blog category
export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    // Find existing category
    const existingCategory = await BlogCategory.findById(id);

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: "Blog category not found" },
        { status: 404 }
      );
    }

    // Handle slug update
    if (body.slug && body.slug !== existingCategory.slug) {
      const slugExists = await BlogCategory.findOne({
        slug: body.slug,
        _id: { $ne: id },
      });

      if (slugExists) {
        return NextResponse.json(
          { success: false, error: "Category with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // Update category
    const updatedCategory = await BlogCategory.findByIdAndUpdate(
      id,
      {
        $set: {
          name: body.name,
          slug: body.slug,
          description: body.description,
          color: body.color,
          icon: body.icon,
          displayOrder: body.displayOrder,
          isActive: body.isActive,
        },
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: "Blog category updated successfully",
    });
  } catch (error) {
    console.error("Error updating blog category:", error);

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
      { success: false, error: "Failed to update blog category" },
      { status: 500 }
    );
  }
});

// DELETE /api/blog-categories/[id] - Delete blog category
export const DELETE = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    const category = await BlogCategory.findByIdAndDelete(id);

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Blog category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Blog category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blog category:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete blog category" },
      { status: 500 }
    );
  }
});

