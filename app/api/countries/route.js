import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Country } from "@/lib/models";
import CountrySection from "@/lib/models/CountrySection";
import { withAdminAuth } from "@/lib/middleware/auth";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const isFeatured = searchParams.get("isFeatured") || "";
    const isPopular = searchParams.get("isPopular") || "";

    const skip = (page - 1) * limit;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (isFeatured !== "") {
      filter.isFeatured = isFeatured === "true";
    }

    if (isPopular !== "") {
      filter.isPopular = isPopular === "true";
    }

    const total = await Country.countDocuments(filter);
    const countries = await Country.find(filter)
      .sort({ displayOrder: 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const countriesWithCounts = await Promise.all(
      countries.map(async (country) => {
        const sectionsCount = await CountrySection.countDocuments({
          country: country._id,
          status: "active",
        });

        return {
          ...country,
          sectionsCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: countriesWithCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching countries:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch countries" },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(async (request) => {
  try {
    const body = await request.json();
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

    const existingCountry = await Country.findOne({
      $or: [{ name: body.name }, { code: body.code }]
    });

    if (existingCountry) {
      return NextResponse.json(
        {
          success: false,
          error: "A country with this name or code already exists",
        },
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

    const country = new Country(body);
    await country.save();

    return NextResponse.json(
      {
        success: true,
        message: "Country created successfully",
        data: country,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Country with this name or code already exists" },
        { status: 400 }
      );
    }
    
    console.error("Error creating country:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create country" },
      { status: 500 }
    );
  }
});
