import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Language from "@/lib/models/Language";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/languages/[id] - Get single language
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Language ID is required" },
        { status: 400 }
      );
    }

    const language = await Language.findById(id).lean();

    if (!language) {
      return NextResponse.json(
        { success: false, error: "Language not found" },
        { status: 404 }
      );
    }

    // Transform the data
    const transformedLanguage = {
      id: language._id,
      name: language.name,
      shortDescription: language.shortDescription || "",
      status: language.status,
      createdAt: language.createdAt,
      updatedAt: language.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedLanguage,
    });
  } catch (error) {
    console.error("Error fetching language:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid language ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch language" },
      { status: 500 }
    );
  }
});

// PUT /api/languages/[id] - Update language
export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Language ID is required" },
        { status: 400 }
      );
    }

    // Find existing language
    const existingLanguage = await Language.findById(id);

    if (!existingLanguage) {
      return NextResponse.json(
        { success: false, error: "Language not found" },
        { status: 404 }
      );
    }

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

    // Update language
    const updatedLanguage = await Language.findByIdAndUpdate(
      id,
      {
        $set: {
          name: body.name,
          shortDescription: body.shortDescription || "",
          status: body.status || "active",
        },
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedLanguage,
      message: "Language updated successfully",
    });
  } catch (error) {
    console.error("Error updating language:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Language with this name already exists" },
        { status: 400 }
      );
    }

    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid language ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update language" },
      { status: 500 }
    );
  }
});

// DELETE /api/languages/[id] - Delete language
export const DELETE = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Language ID is required" },
        { status: 400 }
      );
    }

    const language = await Language.findByIdAndDelete(id);

    if (!language) {
      return NextResponse.json(
        { success: false, error: "Language not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Language deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting language:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid language ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete language" },
      { status: 500 }
    );
  }
});

