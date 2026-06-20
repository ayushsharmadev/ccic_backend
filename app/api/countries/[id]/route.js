import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Country } from "@/lib/models";
import { withAdminAuth } from "@/lib/middleware/auth";
import mongoose from "mongoose";

export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid country ID format" },
        { status: 400 }
      );
    }

    const country = await Country.findById(id).lean();

    if (!country) {
      return NextResponse.json(
        { success: false, error: "Country not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: country,
    });
  } catch (error) {
    console.error("Error fetching country:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch country" },
      { status: 500 }
    );
  }
});

export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid country ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "name",
      "code",
      "capital",
      "currency",
      "language",
      "population",
      "timeZone",
      "callingCode",
      "logo",
      "banner",
      "brochure",
      "shortDescription",
      "longDescription",
    ];
    
    for (const field of requiredFields) {
      if (!body[field] || String(body[field]).trim() === "") {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    if (!body.studyMetrics || body.studyMetrics.tuitionFeeMin == null || !body.studyMetrics.courseDuration) {
      return NextResponse.json(
        { success: false, error: `Study metrics (Tuition Fee, Course Duration) are required` },
        { status: 400 }
      );
    }

    const existingCountryWithCode = await Country.findOne({
      code: body.code,
      _id: { $ne: id },
    });

    if (existingCountryWithCode) {
      return NextResponse.json(
        { success: false, error: "A country with this code already exists" },
        { status: 400 }
      );
    }

    const existingCountryWithName = await Country.findOne({
      name: body.name,
      _id: { $ne: id },
    });

    if (existingCountryWithName) {
      return NextResponse.json(
        { success: false, error: "A country with this name already exists" },
        { status: 400 }
      );
    }

    // Default boolean values
    if (body.isPopular === undefined) body.isPopular = false;
    if (body.isFeatured === undefined) body.isFeatured = false;

    // Study Metrics defaults mapping
    if (!body.studyMetrics) {
      body.studyMetrics = {
        tuitionFeeMin: 0,
        tuitionFeeMax: 0,
        livingCostMin: 0,
        livingCostMax: 0,
        courseDuration: "",
        mediumOfTeaching: "",
      };
    }

    // Study Pathways mapping
    if (body.studyPathways && Array.isArray(body.studyPathways)) {
       body.studyPathways = body.studyPathways.filter(p => p.title || p.duration);
    }

    // Quick Facts mapping
    if (body.quickFacts && Array.isArray(body.quickFacts)) {
       body.quickFacts = body.quickFacts.filter(q => q.label || q.value);
    }

    const updatedCountry = await Country.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedCountry) {
      return NextResponse.json(
        { success: false, error: "Country not found" },
        { status: 404 }
      );
    }

    // Generate new slug if name changed
    if (body.name) {
      await updatedCountry.save(); // triggers pre-save middleware for slug
    }

    return NextResponse.json({
      success: true,
      message: "Country updated successfully",
      data: updatedCountry,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    console.error("Error updating country:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update country" },
      { status: 500 }
    );
  }
});

export const DELETE = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid country ID format" },
        { status: 400 }
      );
    }

    const country = await Country.findById(id);

    if (!country) {
      return NextResponse.json(
        { success: false, error: "Country not found" },
        { status: 404 }
      );
    }

    await Country.findByIdAndDelete(id);

    // TODO: Optionally delete CountrySections related to this country
    // await CountrySection.deleteMany({ country: id });

    return NextResponse.json({
      success: true,
      message: "Country deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting country:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete country" },
      { status: 500 }
    );
  }
});
