import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Exam from "@/lib/models/Exam";
import mongoose from "mongoose";

const examPopulate = [
  { path: "stream", select: "name" },
  { path: "courseName", select: "name" },
  { path: "examType", select: "name shortName" },
  { path: "examLevel", select: "name" },
  { path: "country", select: "name code" },
  { path: "state", select: "name" },
];

function transformExamDetail(item) {
  return {
    id: item._id.toString(),
    title: item.title,
    logo: item.logo,
    applicationFee: item.applicationFee,
    examDate: item.examDate,
    resultDate: item.resultDate,
    applicationDate: item.applicationDate,
    stream: {
      id: item.stream?._id?.toString(),
      name: item.stream?.name,
    },
    course: {
      id: item.courseName?._id?.toString(),
      name: item.courseName?.name,
    },
    examType: {
      id: item.examType?._id?.toString(),
      name: item.examType?.name,
      shortName: item.examType?.shortName,
    },
    examLevel: {
      id: item.examLevel?._id?.toString(),
      name: item.examLevel?.name,
    },
    country: {
      id: item.country?._id?.toString(),
      name: item.country?.name,
      code: item.country?.code,
    },
    state: {
      id: item.state?._id?.toString(),
      name: item.state?.name,
    },
    status: item.status,
    isFeatured: item.isFeatured,
    displayOrder: item.displayOrder,
    slug: item.slug,
    examDescription: item.examDescription,
    eligibilityCriteria: item.eligibilityCriteria,
    applicationProcess: item.applicationProcess,
    examPattern: item.examPattern,
    importantDates: item.importantDates,
    admitCardDetails: item.admitCardDetails,
    resultInformation: item.resultInformation,
    pdf: item.pdf,
  };
}

export async function GET(request, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { slug } = resolvedParams;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Exam slug is required" },
        { status: 400 }
      );
    }

    let query = { slug: slug };

    if (mongoose.Types.ObjectId.isValid(slug)) {
      query = {
        $or: [{ slug: slug }, { _id: new mongoose.Types.ObjectId(slug) }],
      };
    }

    const exam = await Exam.findOne(query)
      .populate(examPopulate)
      .lean();

    if (!exam) {
      return NextResponse.json(
        { success: false, error: "Exam not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transformExamDetail(exam),
    });
  } catch (error) {
    console.error("Error fetching exam details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exam details" },
      { status: 500 }
    );
  }
}
