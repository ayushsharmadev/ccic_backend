import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Country, College, News, Blog } from "@/lib/models";
import CountrySection from "@/lib/models/CountrySection";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { slug } = await params;

    const country = await Country.findOne({ slug, status: "active" }).lean();

    if (!country) {
      return NextResponse.json(
        { success: false, error: "Country not found" },
        { status: 404 }
      );
    }

    // Fetch dynamic sections/tabs
    const sections = await CountrySection.find({
      country: country._id,
      status: "active",
    })
      .sort({ displayOrder: 1 })
      .select("title tabName slug content")
      .lean();

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

    const responseData = {
      ...country,
      sections,
      topColleges,
      totalCollegesCount,
      relatedNews,
      relatedBlogs
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
