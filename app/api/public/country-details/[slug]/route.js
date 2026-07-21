import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Country, College, News, Blog, Exam } from "@/lib/models";
import CountrySection from "@/lib/models/CountrySection";

export const dynamic = "force-dynamic";

const deprecatedSectionTabs = new Set(["study"]);

function buildPublicCountryData(country) {
  return {
    _id: country._id,
    name: country.name,
    shortName: country.shortName,
    code: country.code,
    slug: country.slug,
    capital: country.capital,
    currency: country.currency,
    language: country.language,
    population: country.population,
    timeZone: country.timeZone,
    callingCode: country.callingCode,
    logo: country.logo,
    banner: country.banner,
    brochure: country.brochure,
    countryGallery: country.countryGallery || [],
    shortDescription: country.shortDescription,
    longDescription: country.longDescription,
    quickFacts: country.quickFacts || [],
    faqs: country.faqs || [],
    status: country.status,
    isFeatured: country.isFeatured,
    isPopular: country.isPopular,
    verified: country.verified || false,
    displayOrder: country.displayOrder,
    metaTitle: country.metaTitle,
    metaDescription: country.metaDescription,
    metaKeywords: country.metaKeywords || [],
    focusKeyword: country.focusKeyword,
    canonicalUrl: country.canonicalUrl,
    ogTitle: country.ogTitle,
    ogDescription: country.ogDescription,
    ogImage: country.ogImage,
    twitterTitle: country.twitterTitle,
    twitterDescription: country.twitterDescription,
    twitterImage: country.twitterImage,
    schemaMarkup: country.schemaMarkup,
    createdAt: country.createdAt,
    updatedAt: country.updatedAt,
  };
}

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { slug } = await params;

    const country = await Country.findOne({ slug, status: "active" })
      .populate({ path: "currency", match: { status: "active" }, select: "name code symbol status" })
      .lean();

    if (!country) {
      return NextResponse.json(
        { success: false, error: "Country not found" },
        { status: 404 }
      );
    }

    // Fetch dynamic sections/tabs
    const sections = (await CountrySection.find({
      country: country._id,
      status: "active",
    })
      .sort({ displayOrder: 1 })
      .select("title tabName slug content")
      .lean()).filter(
        (section) =>
          !deprecatedSectionTabs.has(
            String(section.tabName || "").trim().toLowerCase()
          )
      );

    // Fetch Top/Featured Colleges in this country dynamically
    const topColleges = await College.find({
      country: country._id,
      status: "active",
      isFeatured: true,
    })
      .populate("state", "name")
      .populate("district", "name")
      .sort({ displayOrder: 1, name: 1 })
      .limit(10)
      .select("name slug logo banner shortDescription state district averageRating reviewsCount shortName")
      .lean();

    // Count total colleges
    const totalCollegesCount = await College.countDocuments({
      country: country._id,
      status: "active"
    });

    // Fetch Related News
    let relatedNews = await News.find({
      relatedCountries: country._id,
      status: "published"
    })
      .sort({ publishedAt: -1 })
      .limit(3)
      .populate("category", "name slug")
      .select("title slug featuredImage publishedAt category views")
      .lean();

    if (!relatedNews || relatedNews.length === 0) {
      relatedNews = await News.find({ status: "published", isFeatured: true })
        .sort({ publishedAt: -1 })
        .limit(3)
        .populate("category", "name slug")
        .select("title slug featuredImage publishedAt category views")
        .lean();
    }

    // Fetch Related Blogs
    let relatedBlogs = await Blog.find({
      relatedCountries: country._id,
      status: "published"
    })
      .sort({ publishedAt: -1 })
      .limit(3)
      .populate("category", "name slug")
      .select("title slug featuredImage publishedAt category views readTime")
      .lean();

    if (!relatedBlogs || relatedBlogs.length === 0) {
      relatedBlogs = await Blog.find({ status: "published", isFeatured: true })
        .sort({ publishedAt: -1 })
        .limit(3)
        .populate("category", "name slug")
        .select("title slug featuredImage publishedAt category views readTime")
        .lean();
    }

    // Fetch Exams for this country
    const exams = await Exam.find({
      country: country._id,
    })
      .populate("examType", "name")
      .populate("examLevel", "name")
      .sort({ displayRank: 1, title: 1 })
      .select("title slug purpose displayRank examType examLevel")
      .lean();

    const responseData = {
      ...buildPublicCountryData(country),
      sections,
      topColleges,
      totalCollegesCount,
      relatedNews,
      relatedBlogs,
      exams
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching country details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch country details", message: error.message },
      { status: 500 }
    );
  }
}
