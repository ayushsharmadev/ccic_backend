import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CollegeDistanceMeter from "@/lib/models/CollegeDistanceMeter";
import DistanceMeter from "@/lib/models/DistanceMeter";
import { withAdminAuth } from "@/lib/middleware/auth";

const normalizeDistanceMeterDocument = (distanceMeterDoc) => {
  if (!distanceMeterDoc) return distanceMeterDoc;

  return {
    ...distanceMeterDoc,
    distanceMeters: (distanceMeterDoc.distanceMeters || []).map((item) => {
      const distanceMeterData =
        item.distanceMeter && typeof item.distanceMeter === "object"
          ? item.distanceMeter
          : null;

      return {
        distanceMeterId: distanceMeterData
          ? distanceMeterData._id?.toString() ||
          distanceMeterData.id?.toString() ||
          ""
          : item.distanceMeter?.toString() || "",
        distanceMeterName: distanceMeterData?.name || "",
        value: item.value || 0,
      };
    }),
  };
};

const populateDistanceMeters = async (collegeId) => {
  return CollegeDistanceMeter.findOne({ college: collegeId })
    .populate({
      path: "distanceMeters.distanceMeter",
      select: "name shortDescription icon status",
    })
    .lean()
    .then(normalizeDistanceMeterDocument);
};

export const GET = withAdminAuth(async (request, { params }) => {
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

    const distanceMeterDoc = await populateDistanceMeters(id);

    return NextResponse.json({
      success: true,
      data: distanceMeterDoc || { college: id, distanceMeters: [] },
    });
  } catch (error) {
    console.error("Error fetching college distance meters:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch college distance meters" },
      { status: 500 }
    );
  }
});

export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "College ID is required" },
        { status: 400 }
      );
    }

    const distanceMeters = Array.isArray(body.distanceMeters)
      ? body.distanceMeters
      : [];

    const sanitizedDistanceMeters = [];
    const errors = [];

    for (let i = 0; i < distanceMeters.length; i++) {
      const item = distanceMeters[i];

      if (!item || !item.distanceMeter) {
        errors.push(`Item ${i + 1}: Distance meter is required`);
        continue;
      }

      if (!item.value && item.value !== 0) {
        errors.push(`Item ${i + 1}: Distance value is required`);
        continue;
      }

      const value = Number(item.value);
      if (Number.isNaN(value) || value < 0) {
        errors.push(`Item ${i + 1}: Distance value must be a valid non-negative number`);
        continue;
      }

      sanitizedDistanceMeters.push({
        distanceMeter: item.distanceMeter,
        value,
      });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: errors,
        },
        { status: 400 }
      );
    }

    const distanceMeterIds = [
      ...new Set(sanitizedDistanceMeters.map((item) => item.distanceMeter)),
    ];
    const distanceMetersCount = await DistanceMeter.countDocuments({
      _id: { $in: distanceMeterIds },
      status: "active",
    });

    if (distanceMetersCount !== distanceMeterIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: "One or more selected distance meters are invalid or inactive",
        },
        { status: 400 }
      );
    }

    await CollegeDistanceMeter.findOneAndUpdate(
      { college: id },
      {
        college: id,
        distanceMeters: sanitizedDistanceMeters,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    const updatedDistanceMeters = await populateDistanceMeters(id);

    return NextResponse.json({
      success: true,
      message: "College distance meters updated successfully",
      data: updatedDistanceMeters,
    });
  } catch (error) {
    console.error("Error saving college distance meters:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors || {}).map(
        (err) => err.message
      );
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to save college distance meters" },
      { status: 500 }
    );
  }
});

