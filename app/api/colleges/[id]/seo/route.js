import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import College from "@/lib/models/College";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/colleges/[id]/seo - Get college SEO data (Admin only)
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "College ID is required" },
        { status: 400 }
      );
    }

    const college = await College.findById(id).select(
      "_id name slug metaTitle metaDescription metaKeywords focusKeyword canonicalUrl ogTitle ogDescription ogImage twitterTitle twitterDescription twitterImage schemaMarkup"
    );

    if (!college) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: college._id,
        name: college.name,
        slug: college.slug,
        metaTitle: college.metaTitle || "",
        metaDescription: college.metaDescription || "",
        metaKeywords: college.metaKeywords || [],
        focusKeyword: college.focusKeyword || "",
        canonicalUrl: college.canonicalUrl || "",
        ogTitle: college.ogTitle || "",
        ogDescription: college.ogDescription || "",
        ogImage: college.ogImage || "",
        twitterTitle: college.twitterTitle || "",
        twitterDescription: college.twitterDescription || "",
        twitterImage: college.twitterImage || "",
        schemaMarkup: college.schemaMarkup || "",
      },
    });
  } catch (error) {
    console.error("Error fetching college SEO data:", error);

    // Detailed error message
    let errorMessage = "Failed to fetch SEO data";
    let statusCode = 500;

    if (error.name === "CastError") {
      errorMessage = `Invalid college ID format: ${error.value}`;
      statusCode = 400;
    } else if (error.message) {
      errorMessage = `Error: ${error.message}`;
    }

    return NextResponse.json(
      { success: false, error: errorMessage, details: error.message },
      { status: statusCode }
    );
  }
});

// PUT /api/colleges/[id]/seo - Update college SEO data (Admin only)
export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "College ID is required" },
        { status: 400 }
      );
    }

    const updateData = {
      metaTitle: body.metaTitle || "",
      metaDescription: body.metaDescription || "",
      metaKeywords: body.metaKeywords || [],
      focusKeyword: body.focusKeyword || "",
      canonicalUrl: body.canonicalUrl || "",
      ogTitle: body.ogTitle || "",
      ogDescription: body.ogDescription || "",
      ogImage: body.ogImage || "",
      twitterTitle: body.twitterTitle || "",
      twitterDescription: body.twitterDescription || "",
      twitterImage: body.twitterImage || "",
      schemaMarkup: body.schemaMarkup || "",
      updatedAt: new Date(),
    };

    const updatedCollege = await College.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select(
      "_id name slug metaTitle metaDescription metaKeywords focusKeyword canonicalUrl ogTitle ogDescription ogImage twitterTitle twitterDescription twitterImage schemaMarkup"
    );

    if (!updatedCollege) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "SEO data updated successfully",
      data: {
        id: updatedCollege._id,
        name: updatedCollege.name,
        slug: updatedCollege.slug,
        metaTitle: updatedCollege.metaTitle,
        metaDescription: updatedCollege.metaDescription,
        metaKeywords: updatedCollege.metaKeywords,
        focusKeyword: updatedCollege.focusKeyword,
        canonicalUrl: updatedCollege.canonicalUrl,
        ogTitle: updatedCollege.ogTitle,
        ogDescription: updatedCollege.ogDescription,
        ogImage: updatedCollege.ogImage,
        twitterTitle: updatedCollege.twitterTitle,
        twitterDescription: updatedCollege.twitterDescription,
        twitterImage: updatedCollege.twitterImage,
        schemaMarkup: updatedCollege.schemaMarkup,
      },
    });
  } catch (error) {
    console.error("Error updating college SEO data:", error);

    // Detailed error message
    let errorMessage = "Failed to update SEO data";
    let statusCode = 500;
    let validationErrors = null;

    // Mongoose Validation Error
    if (error.name === "ValidationError") {
      errorMessage = "Validation failed";
      statusCode = 400;
      validationErrors = {};

      Object.keys(error.errors).forEach((key) => {
        validationErrors[key] = error.errors[key].message;
      });

      // Create a readable error message
      const fieldErrors = Object.entries(validationErrors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join(", ");
      errorMessage = `Validation Error - ${fieldErrors}`;
    }
    // Cast Error (Invalid ID format)
    else if (error.name === "CastError") {
      errorMessage = `Invalid ${error.path}: ${error.value}`;
      statusCode = 400;
    }
    // Duplicate Key Error
    else if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      errorMessage = `Duplicate value for ${field}: "${value}" already exists`;
      statusCode = 409;
    }
    // JSON Parse Error
    else if (error instanceof SyntaxError) {
      errorMessage = `Invalid JSON format: ${error.message}`;
      statusCode = 400;
    }
    // Database Connection Error
    else if (error.message && error.message.includes("buffering timed out")) {
      errorMessage = "Database connection timeout. Please try again.";
      statusCode = 503;
    }
    // Schema Markup JSON Error
    else if (error.message && error.message.includes("schemaMarkup")) {
      errorMessage = `Invalid schema markup: ${error.message}`;
      statusCode = 400;
    }
    // Generic Error with message
    else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        ...(validationErrors && { validationErrors }),
        details: error.message,
        errorType: error.name || "UnknownError"
      },
      { status: statusCode }
    );
  }
});

