
import connectDB from "./lib/db.js";
import { College } from "./lib/models/index.js";
import CollegeCourseAllocation from "./lib/models/CollegeCourseAllocation.js";

async function run() {
  await connectDB();
  const testAlloc = await CollegeCourseAllocation.findOne({ "assignedCourses.examType": { $exists: true, $ne: null } }).lean();
  if (!testAlloc) {
    console.log("No allocations");
    process.exit(0);
  }
  const examId = testAlloc.assignedCourses.find(c => c.examType).examType;
  console.log("Exam ID:", examId);
  const rawCounts = await CollegeCourseAllocation.aggregate([
    { $unwind: "$assignedCourses" },
    { $match: { "assignedCourses.isActive": true, "assignedCourses.examType": examId } },
    { $group: { _id: "$college" } }
  ]);
  console.log("Raw Allocation Count (Ignoring active status):", rawCounts.length);
  const matchedCollegeIds = rawCounts.map(r => r._id);
  const activeColleges = await College.find({ _id: { $in: matchedCollegeIds }, status: "active" }).select("_id status").lean();
  console.log("Active Colleges Count (colleges-listing result):", activeColleges.length);
  process.exit(0);
}
run();

