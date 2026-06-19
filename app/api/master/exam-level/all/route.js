import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ExamLevel from "@/lib/models/ExamLevel";

// GET all exam levels for dropdowns (no pagination)
export async function GET() {
  try {
    await dbConnect();

    // Get all active exam levels
    const examLevels = await ExamLevel.find({ status: "active" })
      .sort({ name: 1 })
      .select("name status");

    return NextResponse.json({
      success: true,
      data: examLevels,
    });
  } catch (error) {
    console.error("Error fetching all exam levels:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exam levels" },
      { status: 500 }
    );
  }
}
