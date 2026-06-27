import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Country } from "@/lib/models";
import CountrySection from "@/lib/models/CountrySection";
import { withAdminAuth } from "@/lib/middleware/auth";
import mongoose from "mongoose";

const deprecatedCountrySectionTabs = ["study"];
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

    const sections = await CountrySection.find({ country: id, tabName: "Overview" })
      .sort({ displayOrder: 1, createdAt: -1 })
      .select("title tabName slug content displayOrder status")
      .lean();
    const documentsRequiredSection = sections.find(
      (section) => String(section.title || "").trim().toLowerCase() === "documents required"
    );
    const dynamicSections = sections.filter(
      (section) => String(section.title || "").trim().toLowerCase() !== "documents required"
    );

    return NextResponse.json({
      success: true,
      data: {
        ...country,
        documentsRequired: documentsRequiredSection?.content || country.documentsRequired || "",
        sections: dynamicSections,
      },
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
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid country ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const payload = buildCountryPayload(body);

    const requiredError = getRequiredCountryError(body, payload);
    if (requiredError) {
      return NextResponse.json(
        { success: false, error: requiredError },
        { status: 400 }
      );
    }

    const existingCountryWithCode = await Country.findOne({
      code: payload.code,
      _id: { $ne: id },
    });

    if (existingCountryWithCode) {
      return NextResponse.json(
        { success: false, error: "A country with this code already exists" },
        { status: 400 }
      );
    }

    const existingCountryWithName = await Country.findOne({
      name: payload.name,
      _id: { $ne: id },
    });

    if (existingCountryWithName) {
      return NextResponse.json(
        { success: false, error: "A country with this name already exists" },
        { status: 400 }
      );
    }

    const updatedCountry = await Country.findByIdAndUpdate(
      id,
      {
        $set: payload,
        $unset: {
          studyMetrics: "",
          admissionDetails: "",
          studyPathways: "",
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedCountry) {
      return NextResponse.json(
        { success: false, error: "Country not found" },
        { status: 404 }
      );
    }

    await Country.collection.updateOne(
      { _id: updatedCountry._id },
      {
        $unset: {
          studyMetrics: "",
          admissionDetails: "",
          studyPathways: "",
          documentsRequired: "",
        },
      }
    );

    const sectionsToCreate = [
      buildDocumentsRequiredSection(body, updatedCountry._id),
      ...buildSectionPayloads(body.sections, updatedCountry._id),
    ];

    await CountrySection.deleteMany({
      country: updatedCountry._id,
      tabName: "Overview",
    });

    if (sectionsToCreate.length > 0) {
      await CountrySection.create(sectionsToCreate);
    }

    await CountrySection.collection.updateMany(
      {
        country: updatedCountry._id,
        tabName: "Overview",
        title: DOCUMENTS_REQUIRED_SECTION_TITLE,
      },
      { $unset: { sectionKey: "" } }
    );

    await CountrySection.deleteMany({
      country: updatedCountry._id,
      tabName: { $in: deprecatedCountrySectionTabs },
    });

    // Generate new slug if name changed
    if (payload.name) {
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
    await CountrySection.deleteMany({ country: id });

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
