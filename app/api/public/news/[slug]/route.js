import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import News from "@/lib/models/News";
import mongoose from "mongoose";

// GET /api/public/news/[slug] - Get single news article by slug
export async function GET(request, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { slug } = resolvedParams;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "News slug is required" },
        { status: 400 }
      );
    }

    // Find news by slug or ID - handle ObjectId properly
    // Only published news
    let query = { slug: slug, status: "published" };

    // If slug looks like an ObjectId, also search by _id
    if (mongoose.Types.ObjectId.isValid(slug)) {
      query = {
        $or: [
          { slug: slug, status: "published" },
          { _id: new mongoose.Types.ObjectId(slug), status: "published" },
        ],
      };
    }

    const newsArticle = await News.findOne(query)
      .populate("category", "name color")
      .populate("author", "firstName lastName email")
      .lean({ virtuals: true });

    if (!newsArticle) {
      return NextResponse.json(
        { success: false, error: "News article not found" },
        { status: 404 }
      );
    }

    // Increment views
    await News.findByIdAndUpdate(newsArticle._id, { $inc: { views: 1 } });

    // Transform the data
    const transformedNews = {
      id: newsArticle._id,
      title: newsArticle.title,
      slug: newsArticle.slug,
      shortDescription: newsArticle.shortDescription,
      content: newsArticle.content,
      category: {
        id: newsArticle.category?._id,
        name: newsArticle.category?.name,
        color: newsArticle.category?.color,
      },
      featuredImage: newsArticle.featuredImage,
      author: {
        id: newsArticle.author?._id,
        name:
          `${newsArticle.author?.firstName || ""} ${newsArticle.author?.lastName || ""
            }`.trim() || "Unknown",
        email: newsArticle.author?.email,
      },
      tags: newsArticle.tags || [],
      isFeatured: newsArticle.isFeatured,
      publishedAt: newsArticle.publishedAt,
      views: (newsArticle.views || 0) + 1,
      readingTime: newsArticle.readingTime,
      formattedPublishedDate: newsArticle.formattedPublishedDate,
      // SEO Fields for frontend
      metaTitle: newsArticle.metaTitle || newsArticle.title,
      metaDescription: newsArticle.metaDescription || newsArticle.shortDescription,
      metaKeywords: newsArticle.metaKeywords || [],
      focusKeyword: newsArticle.focusKeyword || "",
      canonicalUrl: newsArticle.canonicalUrl || "",
      ogTitle: newsArticle.ogTitle || newsArticle.metaTitle || newsArticle.title,
      ogDescription: newsArticle.ogDescription || newsArticle.metaDescription || newsArticle.shortDescription,
      ogImage: newsArticle.ogImage || newsArticle.featuredImage || "",
      twitterTitle: newsArticle.twitterTitle || newsArticle.ogTitle || newsArticle.metaTitle || newsArticle.title,
      twitterDescription: newsArticle.twitterDescription || newsArticle.ogDescription || newsArticle.metaDescription || newsArticle.shortDescription,
      twitterImage: newsArticle.twitterImage || newsArticle.ogImage || newsArticle.featuredImage || "",
      schemaMarkup: newsArticle.schemaMarkup || "",
      createdAt: newsArticle.createdAt,
      updatedAt: newsArticle.updatedAt,
    };

    // Get related news (same category, excluding current)
    const relatedNews = await News.find({
      status: "published",
      category: newsArticle.category?._id,
      _id: { $ne: newsArticle._id },
    })
      .populate("category", "name color")
      .populate("author", "firstName lastName")
      .select("title slug shortDescription featuredImage category author publishedAt views")
      .sort({ publishedAt: -1 })
      .limit(3)
      .lean({ virtuals: true });

    const transformedRelatedNews = relatedNews.map((item) => ({
      id: item._id,
      title: item.title,
      slug: item.slug,
      shortDescription: item.shortDescription,
      featuredImage: item.featuredImage,
      category: {
        id: item.category?._id,
        name: item.category?.name,
        color: item.category?.color,
      },
      author: {
        id: item.author?._id,
        name:
          `${item.author?.firstName || ""} ${item.author?.lastName || ""
            }`.trim() || "Unknown",
      },
      publishedAt: item.publishedAt,
      views: item.views || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        article: transformedNews,
        relatedNews: transformedRelatedNews,
      },
    });
  } catch (error) {
    console.error("Error fetching news article:", error);

    // Handle cast error (invalid ObjectId)
    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid news article format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch news article" },
      { status: 500 }
    );
  }
}

