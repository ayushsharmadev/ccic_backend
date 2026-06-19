import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import "@/lib/models/Language";
import College from "@/lib/models/College";
import Notice from "@/lib/models/Notice";
import CollegeCourseAllocation from "@/lib/models/CollegeCourseAllocation";
import CollegeRanking from "@/lib/models/CollegeRanking";
import CollegeDistanceMeter from "@/lib/models/CollegeDistanceMeter";
import CollegeReview from "@/lib/models/CollegeReview";
import FacilitySection from "@/lib/models/FacilitySection";
import { withAdminAuth } from "@/lib/middleware/auth";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const state = searchParams.get("state") || "";
    const district = searchParams.get("district") || "";
    const country = searchParams.get("country") || "";
    const status = searchParams.get("status") || "";
    const isFeatured = searchParams.get("isFeatured") || "";
    const isPopular = searchParams.get("isPopular") || "";

    const skip = (page - 1) * limit;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { shortName: { $regex: search, $options: "i" } },
        { popularName: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { "state.name": { $regex: search, $options: "i" } },
        { "district.name": { $regex: search, $options: "i" } },
        { "ownership.name": { $regex: search, $options: "i" } },
        { "affiliation.name": { $regex: search, $options: "i" } },
      ];
    }

    if (country) {
      filter.country = country;
    }

    if (state) {
      filter.state = state;
    }

    if (district) {
      filter.district = district;
    }

    if (status) {
      filter.status = status;
    }

    if (isFeatured !== "") {
      filter.isFeatured = isFeatured === "true";
    }

    if (isPopular !== "") {
      filter.isPopular = isPopular === "true";
    }

    const total = await College.countDocuments(filter);
    const colleges = await College.find(filter)
      .populate("country", "name code")
      .populate("state", "name code")
      .populate("district", "name")
      .populate("ownership", "name")
      .populate("affiliation", "name")
      .populate("languages", "name")
      .populate("approvedThrough", "name")
      .populate("facilities", "name image")
      .sort({ displayOrder: 1, createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const collegesWithCounts = await Promise.all(
      colleges.map(async (college) => {
        const [noticeCount, courseAllocation, rankingDoc, distanceMeterDoc, reviewsCount, sectionsCount] = await Promise.all([
          Notice.countDocuments({
            college: college._id,
            status: "active",
          }),
          CollegeCourseAllocation.findOne({ college: college._id }).lean(),
          CollegeRanking.findOne({ college: college._id }).lean(),
          CollegeDistanceMeter.findOne({ college: college._id }).lean(),
          CollegeReview.countDocuments({ college: college._id }),
          FacilitySection.countDocuments({
            college: college._id,
            status: "active",
          }),
        ]);

        return {
          ...college,
          noticesCount: noticeCount,
          coursesCount: courseAllocation?.assignedCourses?.length || 0,
          rankingsCount: rankingDoc?.rankings?.length || 0,
          distanceMetersCount: distanceMeterDoc?.distanceMeters?.length || 0,
          reviewsCount: reviewsCount,
          sectionsCount: sectionsCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: collegesWithCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch colleges" },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(async (request) => {
  try {
    const body = await request.json();
    const requiredFields = [
      "name",
      "ownership",
      "affiliation",
      "country",
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

    if (body.isPopular === undefined) body.isPopular = false;
    if (body.isVerified === undefined) body.isVerified = false;

    delete body.ranking;

    const college = new College(body);
    await college.save();

    const populatedCollege = await College.findById(college._id)
      .populate("country", "name code")
      .populate("state", "name code")
      .populate("district", "name")
      .populate("ownership", "name")
      .populate("affiliation", "name")
      .populate("languages", "name")
      .populate("approvedThrough", "name")
      .populate("facilities", "name image")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "College created successfully",
        data: populatedCollege,
      },
      { status: 201 }
    );
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
      { success: false, error: "Failed to create college" },
      { status: 500 }
    );
  }
});
