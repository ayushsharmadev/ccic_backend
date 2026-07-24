import mongoose from "mongoose";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Currency from "@/lib/models/Currency";
import Country from "@/lib/models/Country";
import CollegeCourseAllocation from "@/lib/models/CollegeCourseAllocation";
import Exam from "@/lib/models/Exam";
import { withAdminAuth } from "@/lib/middleware/auth";

function invalidId(id) {
  return !mongoose.Types.ObjectId.isValid(id);
}

export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    if (invalidId(id)) return NextResponse.json({ success: false, error: "Invalid currency ID" }, { status: 400 });
    const currency = await Currency.findById(id).lean();
    if (!currency) return NextResponse.json({ success: false, error: "Currency not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: currency });
  } catch (error) {
    console.error("Error fetching currency:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch currency" }, { status: 500 });
  }
});

export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    if (invalidId(id)) return NextResponse.json({ success: false, error: "Invalid currency ID" }, { status: 400 });
    const body = await request.json();
    const allowed = ["name", "code", "symbol", "status", "displayOrder"];
    const payload = {};
    for (const field of allowed) if (body[field] !== undefined) payload[field] = body[field];
    if (payload.code) payload.code = String(payload.code).trim().toUpperCase();
    const currency = await Currency.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!currency) return NextResponse.json({ success: false, error: "Currency not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Currency updated successfully", data: currency });
  } catch (error) {
    if (error.name === "ValidationError") {
      return NextResponse.json({ success: false, error: Object.values(error.errors)[0]?.message || "Validation failed" }, { status: 400 });
    }
    if (error.code === 11000) return NextResponse.json({ success: false, error: "Currency name or code already exists" }, { status: 400 });
    console.error("Error updating currency:", error);
    return NextResponse.json({ success: false, error: "Failed to update currency" }, { status: 500 });
  }
});

export const DELETE = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    if (invalidId(id)) return NextResponse.json({ success: false, error: "Invalid currency ID" }, { status: 400 });
    const currency = await Currency.findByIdAndDelete(id);
    if (!currency) return NextResponse.json({ success: false, error: "Currency not found" }, { status: 404 });
    return NextResponse.json({
      success: true,
      message: "Currency deleted successfully",
      data: currency,
    });
  } catch (error) {
    console.error("Error deleting currency:", error);
    return NextResponse.json({ success: false, error: "Failed to delete currency" }, { status: 500 });
  }
});
