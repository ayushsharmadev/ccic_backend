import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Country from "@/lib/models/Country";
import { withAdminAuth } from "@/lib/middleware/auth";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const country = await Country.findById(id).lean();
    if (!country) {
      return NextResponse.json(
        { success: false, error: "Country not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: country });
  } catch (error) {
    console.error("Error fetching country:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch country" },
      { status: 500 }
    );
  }
}

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

    const updatedCountry = await Country.findByIdAndUpdate(
      id,
      {
        ...body,
        ...(body.code ? { code: body.code.trim().toUpperCase() } : {}),
        name: body.name.trim(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedCountry) {
      return NextResponse.json(
        { success: false, error: "Country not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Country updated successfully",
      data: updatedCountry,
    });
  } catch (error) {
    console.error("Error updating country:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Country with this name or code already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update country" },
      { status: 500 }
    );
  }
});

export const DELETE = withAdminAuth(async (_request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;

    const deletedCountry = await Country.findByIdAndDelete(id);
    if (!deletedCountry) {
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
    console.error("Error deleting country:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete country" },
      { status: 500 }
    );
  }
});
