import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CountryMaster from "@/lib/models/CountryMaster";
import { withAdminAuth } from "@/lib/middleware/auth";

// GET /api/locations/country-master/[id]
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const country = await CountryMaster.findById(id).lean();
    if (!country) {
      return NextResponse.json(
        { success: false, error: "Country not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: country });
  } catch (error) {
    console.error("Error fetching country master:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch country" },
      { status: 500 }
    );
  }
}

// PUT /api/locations/country-master/[id] — Admin only
export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "name is required" },
        { status: 400 }
      );
    }

    const updated = await CountryMaster.findByIdAndUpdate(
      id,
      {
        name: body.name.trim(),
        ...(body.code ? { code: body.code.trim().toUpperCase() } : {}),
        ...(body.status ? { status: body.status } : {}),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Country not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Country updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating country master:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Country with this name or code already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update country" },
      { status: 500 }
    );
  }
});

// DELETE /api/locations/country-master/[id] — Admin only
export const DELETE = withAdminAuth(async (_request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;

    const deleted = await CountryMaster.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Country not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Country deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting country master:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete country" },
      { status: 500 }
    );
  }
});
