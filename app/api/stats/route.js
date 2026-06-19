import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import College from "@/lib/models/College";
import Course from "@/lib/models/Course";
import Exam from "@/lib/models/Exam";
import User from "@/lib/models/User";
import State from "@/lib/models/State";
import District from "@/lib/models/District";
import Stream from "@/lib/models/Stream";
import Degree from "@/lib/models/Degree";
import CourseDuration from "@/lib/models/CourseDuration";
import ExamType from "@/lib/models/ExamType";
import Ranking from "@/lib/models/Ranking";
import Ownership from "@/lib/models/Ownership";
import CollegeFacility from "@/lib/models/CollegeFacility";
import Affiliation from "@/lib/models/Affiliation";

export async function GET() {
  try {
    await connectDB();

    // Fetch all counts in parallel for better performance
    const [
      totalColleges,
      totalCourses,
      totalExams,
      totalUsers,
      totalStates,
      totalDistricts,
      totalStreams,
      totalDegrees,
      totalCourseDurations,
      totalExamTypes,
      totalRankings,
      totalOwnerships,
      totalFacilities,
      totalAffiliations,
    ] = await Promise.all([
      College.countDocuments(),
      Course.countDocuments(),
      Exam.countDocuments(),
      User.countDocuments(),
      State.countDocuments(),
      District.countDocuments(),
      Stream.countDocuments(),
      Degree.countDocuments(),
      CourseDuration.countDocuments(),
      ExamType.countDocuments(),
      Ranking.countDocuments(),
      Ownership.countDocuments(),
      CollegeFacility.countDocuments(),
      Affiliation.countDocuments(),
    ]);

    const stats = {
      totalColleges,
      totalCourses,
      totalExams,
      totalUsers,
      totalStates,
      totalDistricts,
      totalStreams,
      totalDegrees,
      totalCourseDurations,
      totalExamTypes,
      totalRankings,
      totalOwnerships,
      totalFacilities: totalFacilities,
      totalAffiliations,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
