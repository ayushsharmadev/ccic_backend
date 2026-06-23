import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import News from "@/lib/models/News";
import NewsCategory from "@/lib/models/NewsCategory";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    // Only consider published news
    // Note: status is used, isPublished might also be present depending on model, we'll check status
    const matchFilter = { status: "published" };

    const [categoriesResult, tagsResult] = await Promise.all([
      News.aggregate([
        { $match: matchFilter },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        {
          $lookup: {
            from: "newscategories",
            localField: "_id",
            foreignField: "_id",
            as: "categoryDetails"
          }
        },
        { $unwind: "$categoryDetails" },
        {
          $project: {
            id: "$_id",
            name: "$categoryDetails.name",
            slug: "$categoryDetails.slug",
            color: "$categoryDetails.color",
            count: 1,
            _id: 0
          }
        },
        { $sort: { name: 1 } }
      ]),
      News.aggregate([
        { $match: matchFilter },
        { $unwind: "$tags" },
        { $match: { tags: { $ne: null, $ne: "" } } },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        {
          $project: {
            value: "$_id",
            label: "$_id",
            count: 1,
            _id: 0
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);

    const sortOptions = [
      { value: "latest", label: "Latest" },
      { value: "popular", label: "Popular" },
      { value: "oldest", label: "Oldest" },
    ];

    return NextResponse.json({
      success: true,
      data: {
        categories: categoriesResult,
        tags: tagsResult,
        sortOptions,
      },
    });
  } catch (error) {
    console.error("Error fetching news filters:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch news filters" },
      { status: 500 }
    );
  }
}
