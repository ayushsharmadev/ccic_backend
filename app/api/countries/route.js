import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Country } from "@/lib/models";
import CountrySection from "@/lib/models/CountrySection";
import { withAdminAuth } from "@/lib/middleware/auth";

const DOCUMENTS_REQUIRED_SECTION_TITLE = "Documents Required";

const allowedCountryFields = [
  "name",
  "shortName",
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
  "countryGallery",
  "shortDescription",
  "longDescription",
  "metaTitle",
  "metaDescription",
  "metaKeywords",
  "focusKeyword",
  "canonicalUrl",
  "ogTitle",
  "ogDescription",
  "ogImage",
  "twitterTitle",
  "twitterDescription",
  "twitterImage",
  "schemaMarkup",
  "status",
  "isFeatured",
  "isPopular",
  "verified",
  "displayOrder",
  "faqs",
  "quickFacts",
];

function buildCountryPayload(body) {
  const payload = {};

  allowedCountryFields.forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  });

  payload.isPopular = Boolean(body.isPopular);
  payload.isFeatured = Boolean(body.isFeatured);
  payload.verified = Boolean(body.verified);
  payload.displayOrder = Number(body.displayOrder) || 0;
  payload.status = body.status || "active";

  if (Array.isArray(body.quickFacts)) {
    payload.quickFacts = body.quickFacts
      .map((fact) => ({
        label: String(fact.label || "").trim(),
        value: String(fact.value || "").trim(),
      }))
      .filter((fact) => fact.label && fact.value);
  }

  if (Array.isArray(body.faqs)) {
    payload.faqs = body.faqs
      .map((faq) => ({
        question: String(faq.question || "").trim(),
        answer: String(faq.answer || "").trim(),
      }))
      .filter((faq) => faq.question && faq.answer);
  }

  if (Array.isArray(body.countryGallery)) {
    payload.countryGallery = body.countryGallery
      .map((item) => ({
        url: String(item.url || "").trim(),
        type: item.type || "image",
      }))
      .filter((item) => item.url);
  }

  if (Array.isArray(body.metaKeywords)) {
    payload.metaKeywords = body.metaKeywords
      .map((keyword) => String(keyword || "").trim())
      .filter(Boolean);
  }

  if (body.documentsRequired !== undefined) {
    payload.documentsRequired = body.documentsRequired;
  }

  return payload;
}

function buildSectionPayloads(sections, countryId) {
  if (!Array.isArray(sections)) return [];

  return sections
    .map((section, index) => ({
      title: String(section.title || "").trim(),
      tabName: "Overview",
      content: String(section.content || "").trim(),
      country: countryId,
      displayOrder:
        section.displayOrder !== undefined ? Number(section.displayOrder) + 1 : index + 1,
      status: section.status || "active",
    }))
    .filter((section) => section.title && section.content);
}

function buildDocumentsRequiredSection(body, countryId) {
  const content = String(body.documentsRequired || "").trim();

  return {
    title: DOCUMENTS_REQUIRED_SECTION_TITLE,
    tabName: "Overview",
    content,
    country: countryId,
    displayOrder: 0,
    status: "active",
  };
}

function isBlank(value) {
  return String(value ?? "").trim() === "";
}

function isBlankRichText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim() === "";
}

function getRequiredCountryError(body, payload) {
  const requiredTextFields = [
    ["name", "Country name"],
    ["shortName", "Short name"],
    ["code", "Country code"],
    ["capital", "Capital city"],
    ["currency", "Currency"],
    ["language", "Language"],
    ["population", "Population"],
    ["timeZone", "Time zone"],
    ["callingCode", "Calling code"],
    ["shortDescription", "Short description"],
    ["status", "Status"],
  ];

  for (const [field, label] of requiredTextFields) {
    if (isBlank(body[field])) return `${label} is required`;
  }

  if (isBlankRichText(body.longDescription)) {
    return "Long description is required";
  }

  if (isBlankRichText(body.documentsRequired)) {
    return "Documents required is required";
  }

  if (isBlank(body.logo)) return "Country logo is required";
  if (isBlank(body.banner)) return "Country banner is required";
  if (isBlank(body.brochure)) return "Country brochure is required";

  if (body.displayOrder === undefined || body.displayOrder === "" || Number.isNaN(Number(body.displayOrder))) {
    return "Display order is required";
  }

  for (const field of ["isFeatured", "isPopular", "verified"]) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      return `${field} is required`;
    }
  }

  if (!payload.countryGallery?.length) {
    return "At least one country gallery image is required";
  }

  if (!payload.quickFacts?.length) {
    return "At least one quick fact is required";
  }

  if (!payload.faqs?.length) {
    return "At least one FAQ is required";
  }

  return null;
}

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
    await connectDB();
    const body = await request.json();
    const payload = buildCountryPayload(body);

    const requiredError = getRequiredCountryError(body, payload);
    if (requiredError) {
      return NextResponse.json(
        { success: false, error: requiredError },
        { status: 400 }
      );
    }

    const existingCountry = await Country.findOne({
      $or: [{ name: payload.name }, { code: payload.code }]
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

    const country = new Country(payload);
    await country.save();
    await Country.collection.updateOne(
      { _id: country._id },
      { $unset: { documentsRequired: "" } }
    );

    const sectionsToCreate = [
      buildDocumentsRequiredSection(body, country._id),
      ...buildSectionPayloads(body.sections, country._id),
    ];

    if (sectionsToCreate.length > 0) {
      await CountrySection.create(sectionsToCreate);
    }

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
