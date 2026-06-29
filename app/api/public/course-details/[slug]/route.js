import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Course from "@/lib/models/Course";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { slug } = resolvedParams;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Course slug is required" },
        { status: 400 }
      );
    }

    // Find course by slug or ID - handle ObjectId properly
    let query = { slug: slug };

    // If slug looks like an ObjectId, also search by _id
    if (mongoose.Types.ObjectId.isValid(slug)) {
      query = {
        $or: [{ slug: slug }, { _id: new mongoose.Types.ObjectId(slug) }],
      };
    }

    const course = await Course.findOne(query)
      .populate("streamId", "name logo about")
      .populate("degreeId", "name shortName description")
      .lean();

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    // Transform course data for frontend
    const transformedCourse = {
      id: course._id,
      slug: course.slug,
      name: course.name,
      logo: course.logo,
      icon: course.icon,
      averageFee: course.averageFee,

      // Stream and Degree
      stream: course.streamId
        ? {
          id: course.streamId._id,
          name: course.streamId.name,
          logo: course.streamId.logo,
          about: course.streamId.about,
        }
        : null,
      degree: course.degreeId
        ? {
          id: course.degreeId._id,
          name: course.degreeId.name,
          shortName: course.degreeId.shortName,
          description: course.degreeId.description,
        }
        : null,

      // Rich Content
      description: course.description,
      admissionProcess: course.admissionProcess,
      eligibilityCriteria: course.eligibilityCriteria,
      entranceExamsDetails: course.entranceExamsDetails,
      howToPrepare: course.howToPrepare,

      // Status and metadata
      status: course.status,
      isFeatured: course.isFeatured,
      displayOrder: course.displayOrder,

      // Timestamps
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedCourse,
    });
  } catch (error) {
    console.error("Error fetching course details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch course details" },
      { status: 500 }
    );
  }
}
