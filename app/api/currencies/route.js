import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Currency from "@/lib/models/Currency";
import { withAdminAuth } from "@/lib/middleware/auth";

function payloadFrom(body) {
  return {
    name: String(body.name || "").trim(),
    code: String(body.code || "").trim().toUpperCase(),
    symbol: String(body.symbol || "").trim(),
    status: body.status || "active",
    displayOrder: Number(body.displayOrder) || 0,
  };
}

export const GET = withAdminAuth(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page")) || 1, 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit")) || 50, 1), 200);
    const search = String(searchParams.get("search") || "").trim();
    const status = searchParams.get("status") || "";
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { symbol: { $regex: search, $options: "i" } },
      ];
    }
    if (status) filter.status = status;

    const [currencies, total] = await Promise.all([
      Currency.find(filter)
        .sort({ displayOrder: 1, code: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Currency.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: currencies,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching currencies:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch currencies" }, { status: 500 });
  }
});

export const POST = withAdminAuth(async (request) => {
  try {
    await connectDB();
    const payload = payloadFrom(await request.json());
    const currency = await Currency.create(payload);
    return NextResponse.json(
      { success: true, message: "Currency created successfully", data: currency },
      { status: 201 }
    );
  } catch (error) {
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: Object.values(error.errors)[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: "Currency name or code already exists" }, { status: 400 });
    }
    console.error("Error creating currency:", error);
    return NextResponse.json({ success: false, error: "Failed to create currency" }, { status: 500 });
  }
});
