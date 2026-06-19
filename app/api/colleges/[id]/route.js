import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import "@/lib/models/Language";
import College from "@/lib/models/College";
import { withAdminAuth } from "@/lib/middleware/auth";

export async function GET(request, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "College ID is required" },
        { status: 400 }
      );
    }

    const college = await College.findById(id)
      .populate("country", "name code")
      .populate({
        path: "state",
        select: "name code country",
        populate: { path: "country", select: "name code" },
      })
      .populate("district", "name")
      .populate("ownership", "name")
      .populate("affiliation", "name")
      .populate("languages", "name")
      .populate("approvedThrough", "name")
      .populate("facilities", "name image")
      .lean();

    if (!college) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: college,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch college" },
      { status: 500 }
    );
  }
}

// PUT /api/colleges/[id] - Update a college by ID (Admin only)
export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "College ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = [
      "name",
      "country",
      "ownership",
      "affiliation",
      "state",
      "district",
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    if (body.facilities && !Array.isArray(body.facilities)) {
      return NextResponse.json(
        { success: false, error: "facilities must be an array" },
        { status: 400 }
      );
    }

    if (!body.facilities) body.facilities = [];

    const existingCollege = await College.findOne({
      name: body.name,
      district: body.district,
      _id: { $ne: id },
    });

    if (existingCollege) {
      return NextResponse.json(
        {
          success: false,
          error: "A college with this name already exists in the same district",
        },
        { status: 400 }
      );
    }

    if (body.pinCode && body.pinCode.length > 10) {
      return NextResponse.json(
        { success: false, error: "Pin code cannot exceed 10 characters" },
        { status: 400 }
      );
    }

    if (body.phoneNumber && body.phoneNumber.length > 20) {
      return NextResponse.json(
        { success: false, error: "Phone number cannot exceed 20 characters" },
        { status: 400 }
      );
    }

    if (body.tollFreeNumber && body.tollFreeNumber.length > 20) {
      return NextResponse.json(
        {
          success: false,
          error: "Toll free number cannot exceed 20 characters",
        },
        { status: 400 }
      );
    }

    if (body.helplineNumber && body.helplineNumber.length > 20) {
      return NextResponse.json(
        {
          success: false,
          error: "Helpline number cannot exceed 20 characters",
        },
        { status: 400 }
      );
    }

    if (body.pinCode === "") body.pinCode = undefined;
    if (body.phoneNumber === "") body.phoneNumber = undefined;
    if (body.tollFreeNumber === "") body.tollFreeNumber = undefined;
    if (body.helplineNumber === "") body.helplineNumber = undefined;
    if (body.hospitalBeds === "" || body.hospitalBeds === null) body.hospitalBeds = undefined;

    if (body.approvedThrough !== undefined) {
      if (typeof body.approvedThrough === "string") {
        try {
          body.approvedThrough = JSON.parse(body.approvedThrough);
        } catch {
          if (body.approvedThrough === "") {
            body.approvedThrough = [];
          } else {
            body.approvedThrough = [body.approvedThrough];
          }
        }
      }

      if (Array.isArray(body.approvedThrough)) {
        body.approvedThrough = body.approvedThrough
          .filter((item) => item !== "" && item !== null && item !== undefined)
          .map((item) => {
            if (mongoose.Types.ObjectId.isValid(item)) {
              return item;
            }
            return null;
          })
          .filter((item) => item !== null);
      } else if (body.approvedThrough === "") {
        body.approvedThrough = [];
      } else if (body.approvedThrough) {
        if (mongoose.Types.ObjectId.isValid(body.approvedThrough)) {
          body.approvedThrough = [body.approvedThrough];
        } else {
          body.approvedThrough = [];
        }
      } else {
        body.approvedThrough = [];
      }
    }

    if (body.haveHostel === "yes") body.haveHostel = true;
    else if (body.haveHostel === "no") body.haveHostel = false;
    else if (body.haveHostel === undefined) body.haveHostel = false;

    if (body.haveHospital === "yes") body.haveHospital = true;
    else if (body.haveHospital === "no") body.haveHospital = false;
    else if (body.haveHospital === undefined) body.haveHospital = false;

    delete body.ranking;

    const updatedCollege = await College.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate("country", "name code")
      .populate("state", "name code")
      .populate("district", "name")
      .populate("ownership", "name")
      .populate("affiliation", "name")
      .populate("languages", "name")
      .populate("approvedThrough", "name")
      .populate("facilities", "name image")
      .lean();

    if (!updatedCollege) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "College updated successfully",
      data: updatedCollege,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "College with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update college" },
      { status: 500 }
    );
  }
});

export const DELETE = withAdminAuth(async (request, { params }) => {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "College ID is required" },
        { status: 400 }
      );
    }

    const deletedCollege = await College.findByIdAndDelete(id);

    if (!deletedCollege) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "College deleted successfully",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete college" },
      { status: 500 }
    );
  }
});
