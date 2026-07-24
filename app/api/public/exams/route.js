import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Exam from "@/lib/models/Exam";
import { applyDirectLocationFilters } from "@/lib/locationFilters";
import { currencyView, moneyView } from "@/lib/money";

function transformExam(item) {
  return {
    id: item._id,
    title: item.title,
    logo: item.logo,
    applicationFee: item.applicationFee,
    applicationFeeMoney: moneyView(item.applicationFee, item.applicationFeeCurrency),
    examDate: item.examDate,
    resultDate: item.resultDate,
    slug: item.slug,
    stream: {
      id: item.stream?._id,
      name: item.stream?.name,
    },
    course: {
      id: item.courseName?._id,
      name: item.courseName?.name,
    },
    examType: {
      id: item.examType?._id,
      name: item.examType?.name,
      shortName: item.examType?.shortName,
    },
    examLevel: {
      id: item.examLevel?._id,
      name: item.examLevel?.name,
    },
    country: {
      id: item.country?._id,
      name: item.country?.name,
      code: item.country?.code,
      currency: currencyView(item.country?.currency),
    },
    state: {
      id: item.state?._id,
      name: item.state?.name,
    },
    status: item.status,
    isFeatured: item.isFeatured,
    displayOrder: item.displayOrder,
  };
}

const examPopulate = [
  { path: "stream", select: "name" },
  { path: "courseName", select: "name" },
  { path: "examType", select: "name shortName" },
  { path: "examLevel", select: "name" },
  {
    path: "country",
    select: "name code currency",
    populate: { path: "currency", match: { status: "active" }, select: "name code symbol status" },
  },
  { path: "applicationFeeCurrency", match: { status: "active" }, select: "name code symbol status" },
  { path: "state", select: "name" },
];

// GET /api/public/exams - Get public exams data (no auth required)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const count = searchParams.get("count");
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit")) || 6;
    const country = searchParams.get("country") || "";
    const state = searchParams.get("state") || "";
    const stream = searchParams.get("stream") || "";
    const examLevel = searchParams.get("examLevel") || "";

    const baseFilter = { status: "active" };
    applyDirectLocationFilters(baseFilter, { country, state });

    if (stream) baseFilter.stream = stream;
    if (examLevel) baseFilter.examLevel = examLevel;

    // If only count is requested
    if (count === "true" || count === "True") {
      const totalCount = await Exam.countDocuments(baseFilter);

      return NextResponse.json({
        success: true,
        data: {
          totalCount,
        },
      });
    }

    // If featured exams is requested
    if (featured === "true" || featured === "True") {
      const exams = await Exam.find({
        ...baseFilter,
        isFeatured: true,
      })
        .populate(examPopulate)
        .select(
          "title logo applicationFee applicationFeeCurrency examDate resultDate status isFeatured displayOrder slug"
        )
        .sort({ displayOrder: 1, examDate: 1 })
        .limit(limit)
        .lean({ virtuals: true });

      return NextResponse.json({
        success: true,
        data: {
          exams: exams.map(transformExam),
          filters: {
            featured: true,
            country: country || null,
            state: state || null,
            stream: stream || null,
            examLevel: examLevel || null,
            limit,
          },
        },
      });
    }

    // Default: Get all active exams with pagination
    const page = parseInt(searchParams.get("page")) || 1;
    const limitAll = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limitAll;

    const [exams, totalCount] = await Promise.all([
      Exam.find(baseFilter)
        .populate(examPopulate)
        .select(
          "title logo applicationFee applicationFeeCurrency examDate resultDate status isFeatured displayOrder slug"
        )
        .sort({ displayOrder: 1, examDate: 1 })
        .skip(skip)
        .limit(limitAll)
        .lean({ virtuals: true }),
      Exam.countDocuments(baseFilter),
    ]);

    const totalPages = Math.ceil(totalCount / limitAll);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        exams: exams.map(transformExam),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: limitAll,
        },
        filters: {
          country: country || null,
          state: state || null,
          stream: stream || null,
          examLevel: examLevel || null,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching public exams:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exams data" },
      { status: 500 }
    );
  }
}
