import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CollegeCourseAllocation from "@/lib/models/CollegeCourseAllocation";
import Course from "@/lib/models/Course";
import CourseDuration from "@/lib/models/CourseDuration";
import { withAdminAuth } from "@/lib/middleware/auth";

const SESSION_REGEX = /^\d{4}-\d{4}$/;

const normalizeAllocationDocument = (allocation) => {
  if (!allocation) return allocation;

  const clone = {
    ...allocation,
    assignedCourses: (allocation.assignedCourses || []).map((course) => {
      const rawCourse =
        course.course && typeof course.course === "object"
          ? course.course
          : null;
      const rawCourseDuration =
        course.courseDuration && typeof course.courseDuration === "object"
          ? course.courseDuration
          : null;
      const rawExamType =
        course.examType && typeof course.examType === "object"
          ? course.examType
          : null;

      const courseId = rawCourse
        ? rawCourse._id?.toString?.() || rawCourse.id?.toString?.() || ""
        : course.course?.toString?.() || course.course || "";

      const courseDurationId = rawCourseDuration
        ? rawCourseDuration._id?.toString?.() ||
        rawCourseDuration.id?.toString?.() ||
        ""
        : course.courseDuration?.toString?.() || course.courseDuration || "";

      const examTypeId = rawExamType
        ? rawExamType._id?.toString?.() || rawExamType.id?.toString?.() || ""
        : course.examType?.toString?.() || course.examType || "";

      const courseName =
        rawCourse?.name ||
        course.courseName ||
        course.course?.name ||
        "Selected Course";

      const examTypeName = rawExamType?.name || "";

      const defaultStructureType = (
        course.defaultStructureType ||
        course.feeStructures?.[0]?.structureType ||
        course.feeStructures?.[0]?.feeStructureType ||
        "annual"
      )
        .toString()
        .toLowerCase();

      const feeStructures = (course.feeStructures || []).map((structure) => {
        const normalizedStructureType = (
          structure.structureType ||
          structure.feeStructureType ||
          defaultStructureType ||
          "annual"
        )
          .toString()
          .toLowerCase();

        const seatsValue = structure.seats !== undefined && structure.seats !== null
          ? Number(structure.seats)
          : (structure.seats === 0 ? 0 : undefined);

        return {
          session: (structure.session || structure.academicYear || "").trim(),
          structureType: normalizedStructureType,
          seats: seatsValue,
          periods: (structure.periods || []).map((period) => ({
            label: period.label,
            amount: period.amount,
          })),
        };
      });

      return {
        ...course,
        courseId,
        courseName,
        courseDurationId,
        examTypeId,
        examTypeName,
        defaultStructureType,
        feeStructures,
        isActive: course.isActive !== undefined ? !!course.isActive : true,
        notes: course.notes || "",
      };
    }),
  };

  return clone;
};

const sanitizeAssignedCourses = (payload) => {
  const sanitized = [];

  for (const item of payload) {
    if (!item || !item.course || !item.courseDuration) {
      continue;
    }

    const rawStructures = Array.isArray(item.feeStructures)
      ? item.feeStructures
      : [];

    if (!rawStructures.length) {
      continue;
    }

    const sanitizedStructures = [];

    for (const structure of rawStructures) {
      if (!structure) continue;

      const rawSession = structure.session || structure.academicYear || "";
      const session = rawSession.trim();
      if (!session || !SESSION_REGEX.test(session)) {
        continue;
      }

      const rawType =
        (structure.structureType ||
          structure.feeStructureType ||
          item.defaultStructureType ||
          item.feeStructureType ||
          "annual")
          .toString()
          .toLowerCase();

      const structureType = ["annual", "semester"].includes(rawType)
        ? rawType
        : "annual";

      const periods = Array.isArray(structure.periods)
        ? structure.periods
          .map((period) => {
            if (!period || !period.label) {
              return null;
            }

            const amount = Number(period.amount);
            if (Number.isNaN(amount) || amount < 0) {
              return null;
            }

            return {
              label: period.label.trim(),
              amount,
            };
          })
          .filter(Boolean)
        : [];

      if (!periods.length) {
        continue;
      }

      let sanitizedSeats = undefined;
      if (structure.seats !== undefined && structure.seats !== null && structure.seats !== "") {
        const seatsNum = Number(structure.seats);
        if (!Number.isNaN(seatsNum) && seatsNum >= 0) {
          sanitizedSeats = seatsNum;
        }
      }

      const structureToPush = {
        session,
        structureType,
        periods,
      };

      if (sanitizedSeats !== undefined) {
        structureToPush.seats = sanitizedSeats;
      }

      sanitizedStructures.push(structureToPush);
    }

    if (!sanitizedStructures.length) {
      continue;
    }

    const defaultStructureType = (
      item.defaultStructureType ||
      sanitizedStructures[0]?.structureType ||
      "annual"
    )
      .toString()
      .toLowerCase();

    sanitized.push({
      course: item.course,
      courseDuration: item.courseDuration,
      examType: item.examType || undefined,
      defaultStructureType,
      feeStructures: sanitizedStructures,
      notes: item.notes?.trim() || undefined,
      isActive: item.isActive !== undefined ? !!item.isActive : true,
    });
  }

  return sanitized;
};

const populateAllocation = async (collegeId) => {
  return CollegeCourseAllocation.findOne({ college: collegeId })
    .populate({
      path: "assignedCourses.course",
      select: "name slug streamId degreeId status",
      populate: [
        { path: "streamId", select: "name" },
        { path: "degreeId", select: "name" },
      ],
    })
    .populate({
      path: "assignedCourses.courseDuration",
      select: "value unit name",
    })
    .populate({
      path: "assignedCourses.examType",
      select: "name shortName",
    })
    .lean()
    .then(normalizeAllocationDocument);
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

    const allocation = await populateAllocation(id);

    return NextResponse.json({
      success: true,
      data: allocation || { college: id, assignedCourses: [] },
    });
  } catch (error) {
    console.error("Error fetching course allocations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch course allocations" },
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

    const assignedCourses = sanitizeAssignedCourses(body.assignedCourses);

    if (!assignedCourses.length) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid course assignments provided",
          details: [
            "Please select at least one course, choose a duration, and add sessions with fee details.",
          ],
        },
        { status: 400 }
      );
    }

    // Validate referenced ids exist
    const courseIds = [...new Set(assignedCourses.map((item) => item.course))];
    const durationIds = [
      ...new Set(assignedCourses.map((item) => item.courseDuration)),
    ];

    const coursesCount = await Course.countDocuments({
      _id: { $in: courseIds },
      status: "active",
    });
    if (coursesCount !== courseIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: "One or more selected courses are invalid or inactive",
        },
        { status: 400 }
      );
    }

    const durationsCount = await CourseDuration.countDocuments({
      _id: { $in: durationIds },
    });
    if (durationsCount !== durationIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: "One or more selected course durations are invalid",
        },
        { status: 400 }
      );
    }

    await CollegeCourseAllocation.findOneAndUpdate(
      { college: id },
      {
        college: id,
        assignedCourses,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    const updatedAllocation = await populateAllocation(id);

    return NextResponse.json({
      success: true,
      message: "Course allocations updated successfully",
      data: updatedAllocation,
    });
  } catch (error) {
    console.error("Error saving course allocations:", error);

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
      { success: false, error: "Failed to save course allocations" },
      { status: 500 }
    );
  }
});

