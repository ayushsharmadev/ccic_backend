import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PageCategory from "@/lib/models/PageCategory";
import Page from "@/lib/models/Page";
import { verifyToken } from "@/lib/jwt";

// GET - Get single page category by ID
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const category = await PageCategory.findById(id).lean();

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Page category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error fetching page category:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch page category",
      },
      { status: 500 }
    );
  }
}

// PUT - Update page category (Admin only)
export async function PUT(request, { params }) {
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

    const { id } = await params;
    const body = await request.json();
    const { name, status } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await PageCategory.findById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, error: "Page category not found" },
        { status: 404 }
      );
    }

    // Check if another category with same name exists
    const existingCategory = await PageCategory.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      _id: { $ne: id },
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: "Category with this name already exists" },
        { status: 400 }
      );
    }

    // Update category
    category.name = name.trim();
    if (status) category.status = status;

    // Reset slug if name changed
    if (category.isModified("name")) {
      category.slug = undefined;
    }

    await category.save();

    return NextResponse.json({
      success: true,
      message: "Page category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error updating page category:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update page category",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete page category (Admin only)
export async function DELETE(request, { params }) {
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

    const { id } = await params;

    // Check if category exists
    const category = await PageCategory.findById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, error: "Page category not found" },
        { status: 404 }
      );
    }

    // Check if category is being used by any pages
    const pagesCount = await Page.countDocuments({ category: id });
    if (pagesCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category. It is being used by ${pagesCount} page(s)`,
        },
        { status: 400 }
      );
    }

    await PageCategory.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Page category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting page category:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete page category",
      },
      { status: 500 }
    );
  }
}

