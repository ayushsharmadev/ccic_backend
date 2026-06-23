import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import BlogCategory from "@/lib/models/BlogCategory";
import Blog from "@/lib/models/Blog";

// GET /api/public/blogs-filters - Get blog filter options
export async function GET() {
  try {
    await connectDB();

    const [categories, tagsData] = await Promise.all([
      BlogCategory.find({ isActive: true }).sort({ displayOrder: 1, name: 1 }).select("name slug").lean(),
      Blog.aggregate([
        { $match: { status: "published", isPublished: true, tags: { $exists: true, $ne: [] } } },
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    const transformedCategories = categories.map((c) => ({
      id: c._id.toString(),
      value: c._id.toString(),
      label: c.name,
      slug: c.slug,
      count: 0, // Could be aggregated later if needed
    }));

    const transformedTags = tagsData.map((t) => ({
      id: t._id,
      value: t._id,
      label: t._id,
      count: t.count,
    }));

    return NextResponse.json({
      success: true,
      data: {
        categories: transformedCategories,
        tags: transformedTags,
        readTimes: [
          { id: "short", value: "short", label: "Quick Read (< 5 min)" },
          { id: "medium", value: "medium", label: "Medium (5 - 10 min)" },
          { id: "long", value: "long", label: "In-depth (> 10 min)" }
        ],
        sortOptions: [
          { id: "latest", value: "latest", label: "Latest First" },
          { id: "popular", value: "popular", label: "Most Popular" },
          { id: "oldest", value: "oldest", label: "Oldest First" }
        ]
      },
    });
  } catch (error) {
    console.error("Error fetching blog filters:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch filters" },
      { status: 500 }
    );
  }
}
