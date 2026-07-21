import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Currency from "@/lib/models/Currency";

export async function GET() {
  try {
    await connectDB();
    const currencies = await Currency.find({ status: "active" })
      .select("name code symbol displayOrder")
      .sort({ displayOrder: 1, code: 1 })
      .lean();
    return NextResponse.json({ success: true, data: currencies });
  } catch (error) {
    console.error("Error fetching public currencies:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch currencies" }, { status: 500 });
  }
}