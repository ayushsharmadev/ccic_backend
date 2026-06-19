import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Page from "@/lib/models/Page";

// GET /api/public/pages - Get all active pages
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 10;

    const pages = await Page.find({ status: "active" })
      .select("title slug heading coverImage shortDescription createdAt")
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}

